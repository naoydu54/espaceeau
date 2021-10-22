<?php

namespace Front\ProductBundle\Controller;

use Admin\MenuBundle\Entity\Menu;
use Admin\ProductBundle\Entity\AttributProduct;
use Admin\ProductBundle\Entity\FeatureElement;
use Admin\ProductBundle\Entity\FeatureElementTranslation;
use Admin\ProductBundle\Entity\FeatureElementValue;
use Admin\ProductBundle\Entity\FeatureElementValueProduct;
use Admin\ProductBundle\Entity\FeatureElementValueTranslation;
use Admin\ProductBundle\Entity\PreventAvailableProduct;
use Admin\ProductBundle\Entity\Product;
use Doctrine\Common\Collections\ArrayCollection;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class ProductController extends Controller
{
    /**
     * @param Request $request
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function indexAction(Request $request)
    {
        $em = $this->getDoctrine()->getManager();

        /** @var Menu $menu */
        $menu = $em->getRepository(Menu::class)->findOneByRoute($request->attributes->get('_route'));

        /** @var Product[] $products */
        $products = $em->getRepository(Product::class)->findByValid([
            ['dateAdd' => 'ASC'],
        ]);


        return $this->render('FrontProductBundle:Product:index.html.twig', [
            'menu' => $menu,
            'products' => $products,
        ]);
    }

    /**
     * @param Product $product
     * @param $slug
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function viewAction(Product $product, $slug, Request $request)
    {

        $em = $this->getDoctrine()->getManager();

        if ($product->getVisible()) {

            $referer = $request->headers->get('referer');
            $provideBand = false;
            if (strpos($referer, 'brand') !== false) {
                $provideBand = true;
            }

            $idMenu = new ArrayCollection();

            /** @var Menu $productMenu */
            foreach ($product->getMenus() as $productMenu) {
                if ($productMenu->getId() == 2) {
                    $idMenu->add('provideBrandOnly');


                }elseif ($productMenu->getParent() && $productMenu->getParent()->getId() == 2) {
                    if(!$idMenu->contains('provideBrandOnly'))
                    $idMenu->add('provideBrandOnly');
                }

                else {
                    $idMenu->add($productMenu->getId());
                }


            }

            if ($idMenu->count() == 1 && $idMenu->contains('provideBrandOnly')  ){
                $provideBand = true;
            }


            $preventAvailableProduct = $em->getRepository(PreventAvailableProduct::class)->createQueryBuilder('p')
                ->innerJoin('p.products', 'pp')
                ->where('pp.id = :product')
                ->setParameter('product', $product)
                ->innerJoin('p.users', 'pu')
                ->andWhere('pu.id = :user')
                ->setParameter('user', $this->getUser())
                ->setMaxResults(1)
                ->getQuery()
                ->getOneOrNullResult();


            return $this->render('FrontProductBundle:Product:view.html.twig', [
                'product' => $product,
                'provideBand' => $provideBand,
                'preventAvailableProduct' => $preventAvailableProduct
            ]);
        }

        throw $this->createNotFoundException($this->get('translator')->trans("Ce produit n'existe pas !"));
    }


    /**
     * @param Request $request
     * @return JsonResponse
     * @throws \Exception
     */
    public function getFilterAction(Request $request)
    {
        $em = $this->getDoctrine()->getManager();
        $tools = $this->get('admin.admin_bundle.tools');

        $allFilters = [];
        $arrayFeatureElementValues = [];
        $prices = [];
        $brands = [];

        $idMenu = $request->get('idMenu');

        if ($idMenu != 0) {
            /** @var Menu $menu */
            $menu = $em->getRepository(Menu::class)->findOneById($idMenu);
            $products = $menu->getValidProducts();
        } else {
            /** @var Product[] $products */
            $products = $em->getRepository(Product::class)->findBy([
                'visible' => true,
            ]);
        }

        // Récupération des informations sur les produits
        foreach ($products as $product) {
            // Récupération des caractéristiques
            /** @var FeatureElementValueProduct $featureElementValueProduct */
            foreach ($product->getFeatureElementValueProducts() as $featureElementValueProduct) {
                if ($featureElementValueProduct->getFeatureElementValue()->getFeatureElement()->getIsFilter()) {
                    $arrayFeatureElementValues[$featureElementValueProduct->getFeatureElementValue()->getFeatureElement()->getId()][] = $featureElementValueProduct->getFeatureElementValue()->getId();
                }
            }

            // Récupération des prix
            $prices[] = $product->getPriceTtc();

            // Récupération des marques
            if ($product->getBrand()) {
                $brands[] = [
                    'id' => $product->getBrand()->getId(),
                    'name' => $product->getBrand()->getName(),
                ];
            }
        }

        // Prix min / max
        $prices = $tools->getMinMax($prices);

        // Brands
        $brands = array_unique($brands, SORT_REGULAR);

        // S'il y a des filtres
        if (count($arrayFeatureElementValues) > 0) {

            $menuProductFilters = [];

            foreach ($arrayFeatureElementValues as $key => $arrayFeatureElementValue) {

                $arrayFeatureElementValue = array_unique($arrayFeatureElementValue);

                /** @var FeatureElement $featureElement */
                $featureElement = $em->getRepository(FeatureElement::class)->findOneById($key);

                /** @var FeatureElementTranslation $featureElementTranslation */
                $featureElementTranslation = $tools->translate($featureElement->getFeatureElementTranslations());

                $type = $featureElement->getFeatureElementCategory()->getNameCanonical();

                $featureElementValues = [];

                foreach ($arrayFeatureElementValue as $value) {
                    $isInt = true;

                    /** @var FeatureElementValue $featureElementValue */
                    $featureElementValue = $em->getRepository(FeatureElementValue::class)->findOneById($value);

                    /** @var FeatureElementValueTranslation $featureElementValueTranslation */
                    $featureElementValueTranslation = $tools->translate($featureElementValue->getFeatureElementValueTranslations());

                    if (!is_numeric($featureElementValueTranslation->getName())) {
                        $isInt = false;

                        $featureElementValues[] = [
                            'id' => $featureElementValue->getId(),
                            'name' => $featureElementValueTranslation->getName(),
                            'color' => $featureElementValue->getColor(),
                        ];
                    } else {
                        $featureElementValues[] = $featureElementValueTranslation->getName();
                    }

                    if ($isInt) {
                        $featureElementValues = $tools->getMinMax($featureElementValues);
                        $type = 'range';
                    }
                }

                $menuProductFilters[] = [
                    'filter' => [
                        'id' => $featureElement->getId(),
                        'name' => $featureElementTranslation->getName(),
                        'type' => $type,
                    ],
                    'featureElementValues' => $featureElementValues,
                ];
            }

            // S'il y a des filtres pour les produits
            if (count($menuProductFilters) > 0) {
                $allFilters['filters'] = $menuProductFilters;
                $allFilters['brands'] = $brands;
                $allFilters['price'] = $prices;
            }
        }

        return new JsonResponse($allFilters);
    }

    /**
     * @param Request $request
     * @return \Symfony\Component\HttpFoundation\Response
     * @throws \Exception
     */
    public function sendFilterAction(Request $request)
    {
        $em = $this->getDoctrine()->getManager();
        $tools = $this->get('admin.admin_bundle.tools');

        $idMenu = (int)$request->get('val_menu');
        if ($idMenu != 0) {
            /** @var Menu $menu */
            $menu = $em->getRepository(Menu::class)->findOneById($idMenu);
            $products = $menu->getValidProducts();
        } else {
            /** @var Product[] $products */
            $products = $em->getRepository(Product::class)->findBy([
                'visible' => true,
            ]);
        }

        $datas = $request->request->all();
        $r = [];

        // Order
        $order = $request->get('val_order');

        // On tri les filtres sélectionnés
        $featureElementValueSelecteds = [];
        foreach ($datas as $key => $data) {
            $exp = explode('_', $key);

            if (isset($exp[1])) {
                if ($exp[1] == 'filtrerange') {
                    if (isset($exp[3])) {
                        if ($exp[3] == 'min') {
                            $featureElementValueSelecteds[$exp[2]]['min'] = $data;
                        } elseif ($exp[3] == 'max') {
                            $featureElementValueSelecteds[$exp[2]]['max'] = $data;
                        } elseif ($exp[3] == 'filtre') {
                            $featureElementValueSelecteds[$exp[2]]['idFiltre'] = $data;
                        }
                    }
                } elseif ($exp[1] == 'filtreselect') {
                    if (isset($exp[2]) AND is_numeric($exp[2])) {
                        foreach ($data as $value) {
                            $featureElementValueSelecteds['featureElementValues'][$exp[2]][] = intval($value);
                        }
                    } elseif (isset($exp[2])) {
                        foreach ($data as $value) {
                            $featureElementValueSelecteds['brands'][] = $value;
                        }
                    }
                }
            }
        }

        foreach ($products as $product) {
            $featureElementValueProducts = [];

            /** @var FeatureElementValueProduct $featureElementValueProduct */
            foreach ($product->getFeatureElementValueProducts() as $featureElementValueProduct) {
                $featureElementValueProducts[] = $featureElementValueProduct->getFeatureElementValue()->getId();
            }

            $isValid = true;
            foreach ($featureElementValueSelecteds as $key => $featureElementValueSelected) {

                if ($key == 'prix') {
                    $elfFValueMin = (int)$featureElementValueSelected['min'];
                    $elfFValueMax = (int)$featureElementValueSelected['max'];

                    if ($product->getPriceTtc() < $elfFValueMin) {
                        $isValid = false;
                    } else {
                        if ($product->getPriceTtc() > $elfFValueMax) {
                            $isValid = false;
                        }
                    }

                    if (!$isValid) {
                        break 1;
                    }
                } elseif ($key == 'featureElementValues') {
                    $featureElementValueProducts = array_unique($featureElementValueProducts);

                    $filtersToValidate = count($featureElementValueSelected);
                    $countFiltersValidate = 0;

                    foreach ($featureElementValueSelected as $items) {
                        $elementsFiltreSelected = array_unique($items);

                        $elementValid = false;

                        foreach ($elementsFiltreSelected as $elementFiltreSelected) {
                            if (in_array($elementFiltreSelected, $featureElementValueProducts)) {
                                $elementValid = true;
                                break 1;
                            }
                        }

                        if ($elementValid) {
                            $countFiltersValidate++;
                        }

                    }

                    if ($filtersToValidate != $countFiltersValidate) {
                        $isValid = false;
                    }

                    if (!$isValid) {
                        break 1;
                    }
                } elseif ($key == 'brands') {
                    $brandValid = false;

                    foreach ($featureElementValueSelected as $valueBrandId) {
                        if (!is_null($product->getBrand())) {
                            if ($product->getBrand()->getId() == $valueBrandId) {
                                $brandValid = true;

                                break 1;
                            }
                        }
                    }

                    if (!$brandValid) {
                        $isValid = false;
                    }

                    if (!$isValid) {
                        break 1;
                    }

                } else {
                    // Ranges
                    if ($key != 'featureElementValues' and $key != 'prix' and $key != 'brands') {
                        $countVarianteNoFiltre = 0;

                        if ($countVarianteNoFiltre == 0) {

                            /** @var FeatureElementValueProduct $featureElementValueProduct */
                            foreach ($product->getFeatureElementValueProducts() as $featureElementValueProduct) {

                                if ($featureElementValueProduct->getFeatureElementValue()->getFeatureElement()->getId() == $featureElementValueSelected['idFiltre']) {

                                    /** @var FeatureElementValueTranslation $featureElementValueTranslation */
                                    $featureElementValueTranslation = $tools->translate($featureElementValueProduct->getFeatureElementValue()->getFeatureElementValueTranslations());

                                    $elfValue = $featureElementValueTranslation->getName();
                                    $elfFValueMin = (int)$featureElementValueSelected['min'];
                                    $elfFValueMax = (int)$featureElementValueSelected['max'];

                                    if ($elfValue < $elfFValueMin) {
                                        $isValid = false;
                                    } elseif ($elfValue > $elfFValueMax) {
                                        $isValid = false;
                                    }
                                }

                                if (!$isValid) {
                                    break 1;
                                }
                            }
                        } else {
                            $isValid = false;
                        }
                    }
                }
            }

            // Push
            if ($isValid) {
                $r[] = $product;
            }
        }

        // Tri
        if (count($r) > 0) {
            if ($order == "price_asc") {
                usort($r, [$this, "filtreOrderAsc"]);
            } elseif ($order == "price_desc") {
                usort($r, [$this, "filtreOrderDesc"]);
            }
        }

        return $this->render('@FrontProduct/Product/productFilter.html.twig', [
            'products' => $r,
        ]);
    }

    /**
     * @param $a
     * @param $b
     * @return mixed
     */
    private function filtreOrderAsc($a, $b)
    {
        return $a->getPriceTtc() - $b->getPriceTtc();
    }

    /**
     * @param $a
     * @param $b
     * @return mixed
     */
    private function filtreOrderDesc($a, $b)
    {
        return $b->getPriceTtc() - $a->getPriceTtc();
    }


    public function preventProductAvailbaleAction(Product $product)
    {
        $em = $this->getDoctrine()->getManager();
        $preventProductAvailable = new PreventAvailableProduct();

        $user = $this->getUser();

        $preventProductAvailable->addProduct($product);
        $preventProductAvailable->addUser($user);
        $em->persist($preventProductAvailable);
        $em->flush();

        $r = [
            'success' => ['success'],

        ];

        return new JsonResponse($r);


    }

    public function preventProductAttributAvailbaleAction(Product $product, $attribut)
    {
        $em = $this->getDoctrine()->getManager();
        $preventProductAvailable = new PreventAvailableProduct();

        $user = $this->getUser();


        $attribut = $em->getRepository(AttributProduct::class)->find($attribut);
        $preventProductAvailable->addProduct($product);
        $preventProductAvailable->addUser($user);
        $preventProductAvailable->addAttribut($attribut);


        $em->persist($preventProductAvailable);
        $em->flush();

        $r = [
            'success' => ['success'],

        ];

        return new JsonResponse($r);


    }
}

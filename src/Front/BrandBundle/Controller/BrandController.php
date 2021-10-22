<?php

namespace Front\BrandBundle\Controller;

use Admin\MenuBundle\Entity\Menu;
use Admin\MenuBundle\Entity\MenuTranslation;
use Admin\ProductBundle\Entity\Brand;
use Admin\ProductBundle\Entity\Product;
use Doctrine\Common\Collections\ArrayCollection;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;

class BrandController extends Controller
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

        /** @var Brand[] $brands */
        $brands = $em->getRepository(Brand::class)->findAll();

        return $this->render('@FrontBrand/Brand/index.html.twig', [
            'menu' => $menu,
            'brands' => $brands,
        ]);
    }

    /**
     * @param Brand $brand
     * @return \Symfony\Component\HttpFoundation\Response
     * @throws \Exception
     */
    public function viewAction(Brand $brand, Request $request)
    {
        $em = $this->getDoctrine()->getManager();

        /** @var Menu $menu */
        $menu = $em->getRepository(Menu::class)->findOneById(Menu::NOS_MARQUE);


        $menuChildrens = $this->recursifAddProduct($menu, $brand);



        return $this->render('@FrontBrand/Brand/view.html.twig', [
            'brand' => $brand,
            'menu' => $menu,
            'menuChildrens' => $menuChildrens,
        ]);
    }

    private function recursifAddProduct($menu, $brand)
    {
        $menuChildrens = new ArrayCollection();

        /** @var Menu $child */
        foreach ($menu->getChildren() as $child) {

            /** @var Product $product */
            foreach ($child->getProducts() as $product) {
                if (!is_null($product->getBrand())) {
                    if ($product->getBrand()->getId() == $brand->getId()) {

                        if (!$menuChildrens->contains($child)) {
                            $clone = clone $child;
//                            $clone->getProducts()->clear();
                            $menuChildrens->set($clone->getId(), $clone);
                        }

                        $menuChildrens->get($child->getId())->addProduct($product);
                    }
                }
            }

            if ($child->hasChildren()) {
                foreach ($child->getChildren() as $child) {
                    /** @var Product $product */
                    foreach ($child->getProducts() as $product) {
                        if (!is_null($product->getBrand())) {
                            if ($product->getBrand()->getId() == $brand->getId()) {

                                if (!$menuChildrens->contains($child)) {
                                    $clone = clone $child;
//                                    $clone->getProducts()->clear();
                                    $menuChildrens->set($clone->getId(), $clone);
                                }

                                $menuChildrens->get($child->getId())->addProduct($product);
                            }
                        }
                    }
                }
            }
        }
        return $menuChildrens;

    }
}


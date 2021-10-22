<?php

namespace Front\CartBundle\Controller;

use Admin\CarrierBundle\Entity\Carrier;
use Admin\MenuBundle\Entity\Menu;
use Admin\ProductBundle\Entity\AttributProduct;
use Admin\ProductBundle\Entity\CartElement;
use Admin\ProductBundle\Entity\Product;
use Admin\ProductBundle\Entity\ProductTranslation;
use Admin\PromotionBundle\Entity\Promotion;
use Doctrine\Common\Collections\ArrayCollection;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class CartController extends Controller
{
    /**
     * @return \Symfony\Component\HttpFoundation\Response
     * @throws \Doctrine\ORM\ORMException
     * @throws \Doctrine\ORM\OptimisticLockException
     */
    public function indexAction()
    {
        return $this->render('FrontCartBundle:Cart:index.html.twig', [
            'cart' => $this->get('admin.admin_bundle.tools')->getUserCart(),
        ]);
    }

    /**
     * @param Product $product
     * @param Request $request
     * @return JsonResponse
     * @throws \Doctrine\ORM\ORMException
     * @throws \Doctrine\ORM\OptimisticLockException
     */
    public function productAddAction(Product $product, Request $request)
    {
        $em = $this->getDoctrine()->getManager();
        $tools = $this->get('admin.admin_bundle.tools');


        $productIsBrandOnlyArray = new ArrayCollection();
        /** @var Menu $menu */
        foreach ($product->getMenus() as $menu){

            $productIsBrandOnlyArray->add($menu->getId());



        }



        $productIsBrandOnly = null;
        foreach ($productIsBrandOnlyArray as $item) {
            if (count($productIsBrandOnlyArray) == 1){
                if ($item == 2){
                    $productIsBrandOnly = true;
                }
            }else{
                $productIsBrandOnly = false;
            }


        }

        if ($productIsBrandOnly == false){

            $cart = $tools->getUserCart();

            $quantity = $request->get('val_product_qty');

            $arrayAttributProductSelecteds = [];

            foreach ($request->request->all() as $field => $value) {
                $explode = explode('_', $field);
                if ($explode[1] == 'attribut') {
                    $arrayAttributProductSelecteds[] = $value;
                }
            }

            $cartElementExist = null;

            if ($cart->getCartElements()) {
                /** @var CartElement $cartElement */
                foreach ($cart->getCartElements() as $cartElement) {

                    if ($cartElement->getProduct()->getId() == $product->getId()) {

                        if ($cartElement->getAttributProducts()->count() == 0) {
                            $cartElementExist = $cartElement;
                        } else {
                            $arrayAttributValueExists = [];
                            /** @var AttributProduct $attributProduct */
                            foreach ($cartElement->getAttributProducts() as $attributProduct) {
                                $arrayAttributValueExists[] = $attributProduct->getId();
                            }

                            $diff = array_diff($arrayAttributProductSelecteds, $arrayAttributValueExists);

                            if (count($diff) == 0) {
                                $cartElementExist = $cartElement;
                            }
                        }
                    }
                }
            }

            $totalPriceTtc = 0;
            $totalPriceHt = 0;
            $attributProductAdds = [];

            if (!is_null($cartElementExist)) {
                $cartElementExist->setQuantity($cartElementExist->getQuantity() + $quantity);
                $em->persist($cartElementExist);

                $totalPriceTtc += $product->getPriceTtc();
                $totalPriceHt += $product->getPriceHt();

                foreach ($arrayAttributProductSelecteds as $arrayAttributProductSelected) {

                    /** @var AttributProduct $attributProduct */
                    $attributProduct = $em->getRepository(AttributProduct::class)->findOneById($arrayAttributProductSelected);

                    $attributProductAdds[] = [
                        'attributName' => $tools->translate($attributProduct->getAttributValue()->getAttribut()->getAttributTranslations())->getName(),
                        'attributValueName' => $tools->translate($attributProduct->getAttributValue()->getAttributValueTranslations())->getName(),
                    ];

                    $totalPriceTtc += $attributProduct->getImpactPriceTtc();
                    $totalPriceHt += $attributProduct->getImpactPriceHt();
                }
            } else {
                $cartElement = new CartElement();
                $cartElement->setProduct($product);
                $cartElement->setQuantity($quantity);
                $cartElement->setCart($cart);

                $em->persist($cartElement);
                $cart->addCartElement($cartElement);

                $totalPriceTtc += $product->getPriceTtc();
                $totalPriceHt += $product->getPriceHt();

                foreach ($arrayAttributProductSelecteds as $arrayAttributProductSelected) {

                    /** @var AttributProduct $attributProduct */
                    $attributProduct = $em->getRepository(AttributProduct::class)->findOneById($arrayAttributProductSelected);

                    $cartElement->addAttributProduct($attributProduct);

                    $attributProductAdds[] = [
                        'attributName' => $tools->translate($attributProduct->getAttributValue()->getAttribut()->getAttributTranslations())->getName(),
                        'attributValueName' => $tools->translate($attributProduct->getAttributValue()->getAttributValueTranslations())->getName(),
                    ];

                    $totalPriceTtc += $attributProduct->getImpactPriceTtc();
                    $totalPriceHt += $attributProduct->getImpactPriceHt();
                }
            }

            if ($this->getUser()) {
                $em->flush();
            } else {
                $session = $this->get('session');
                $session->set('cart', $cart);
            }

            if (count($product->getFiles()) > 0) {
                $productImage = $tools->imageFilter($this->get('ip_bibliotheque.image.view')->ipBblImageUrl($product->getFiles()->first()->getFile()), [200, 200]);
            } else {
                $productImage = $tools->imageFilter('/assets_front/img/no-image.jpg', [200, 200]);
            }

            /** @var ProductTranslation $productTranslation */
            $productTranslation = $tools->translate($product->getProductTranslations());

            $r = [
                'success' => [
                    'message' => $this->get('translator')->trans("Produit ajouté au panier avec succès"),
                    'name' => $productTranslation->getName(),
                    'attributProducts' => $attributProductAdds,
                    'quantity' => $this->get('translator')->trans("Quantité").': '.$quantity,
                    'totalPriceTtc' => $totalPriceTtc,
                    'totalPriceHt' => $totalPriceHt,
                    'image' => $productImage,
                    'btnStay' => $this->get('translator')->trans("Continuer mes achats"),
                    'btnCart' => $this->get('translator')->trans("Voir mon panier"),
                ],
            ];

        }else{

            $r = [
                'error' => [
                    'message' => 'Ce Produti ne peut pas être acheté',

                ],
            ];
        }





        return new JsonResponse($r);
    }

    /**
     * @param Request $request
     * @return JsonResponse
     * @throws \Doctrine\ORM\ORMException
     * @throws \Doctrine\ORM\OptimisticLockException
     */
    public function elementUpdateQuantityAction(Request $request)
    {
        $em = $this->getDoctrine()->getManager();

        $tools = $this->get('admin.admin_bundle.tools');
        $session = $this->get('session');

        $cart = $tools->getUserCart();

        /** @var CartElement $cartElement */
        $cartElement = $cart->getCartElements()->get($request->get('id'));

        $cartElement->setQuantity($request->get('quantity'));

        if (!is_null($cartElement->getId())) {
            $em->persist($cartElement);
            $em->flush();
        } else {
            $cart->getCartElements()->set($request->get('id'), $cartElement);
            $session->set('cart', $cart);
        }


        $r = [
            'success' => [$this->get('translator')->trans("La quantité a bien été modifiée")],
            'carrierCart'=> $tools->getCarrierCart()
        ];

        return new JsonResponse($r);
    }

    /**
     * @param Request $request
     * @return JsonResponse
     * @throws \Doctrine\ORM\ORMException
     * @throws \Doctrine\ORM\OptimisticLockException
     */
    public function elementDeleteAction(Request $request)
    {
        $em = $this->getDoctrine()->getManager();

        $tools = $this->get('admin.admin_bundle.tools');
        $eventTools = $this->get('admin.admin_calendar.event_tools');
        $session = $this->get('session');

        $cart = $tools->getUserCart();

        /** @var CartElement $cartElement */
        $cartElement = $cart->getCartElements()->get($request->get('id'));

        if (!is_null($cartElement->getCartElementEvent())) {
            $event = $cartElement->getCartElementEvent()->getEvent();

            $eventTools->updateEventPlace($event, 1, 'up');
        }

        if (!is_null($cartElement->getId())) {
            $cart->removeCartElement($cartElement);
            $em->remove($cartElement);

            $em->persist($cart);
            $em->flush();
        } else {
            $cart->getCartElements()->remove($request->get('id'));
            $session->set('cart', $cart);
        }

        $r = [
            'success' => [$this->get('translator')->trans("L'élément a bien été supprimé")],
            'carrierCart'=> $tools->getCarrierCart()

        ];

        return new JsonResponse($r);
    }

    /**
     * @param Request $request
     * @return JsonResponse
     * @throws \Doctrine\ORM\ORMException
     * @throws \Doctrine\ORM\OptimisticLockException
     */
    public function promotionCodeAddAction(Request $request)
    {
        $em = $this->getDoctrine()->getManager();

        /** @var Promotion $promotion */
        $promotion = $em->getRepository(Promotion::class)->findOneByCode($request->request->get('promotionCode'));

        if (!is_null($promotion)) {

            $tools = $this->get('admin.admin_bundle.tools');
            $cart = $tools->getUserCart();

            if (!is_null($this->getUser())) {
                $havePromotion = false;
                if (!is_null($cart->getPromotion())) {
                    $havePromotion = true;
                }

                /** @var CartElement $cartElement */
                foreach ($cart->getCartElements() as $cartElement) {
                    if (!is_null($cartElement->getPromotion())) {
                        $havePromotion = true;
                    }
                }

                if ($havePromotion) {
                    $r = [
                        'error' => "Vous avez déjà ajouté un code, veuillez le supprimer si vous souhaitez en ajouter un nouveau",
                    ];

                    return new JsonResponse($r);
                } else {

                    if ($promotion->isValid($cart)) {
                        $promotionUsableOnCartElement = false;

                        /** @var CartElement $cartElement */
                        foreach ($cart->getCartElements() as $cartElement) {
                            if ($promotion->isUsableWithCartElement($cartElement)) {
                                $promotionUsableOnCartElement = true;
                                $cartElement->setPromotion($promotion);
                                $em->persist($cartElement);
                            }
                        }

                        if (!$promotionUsableOnCartElement) {
                            $cart->setPromotion($promotion);
                            $em->persist($cart);
                        }

                        $em->flush();

                        $r = [
                            'success' => "Code promotion ajouté avec succès",
                        ];

                        return new JsonResponse($r);
                    } else {
                        $r = [
                            'error' => "Code promotion invalide",
                        ];

                        return new JsonResponse($r);
                    }
                }
            } else {
                $r = [
                    'error' => "Vous devez être connecté pour ajouté un code promotion",
                ];

                return new JsonResponse($r);
            }
        }

        $r = [
            'error' => "Ce code promotion n'existe pas",
        ];

        return new JsonResponse($r);
    }

    /**
     * @param Request $request
     * @return JsonResponse
     * @throws \Doctrine\ORM\ORMException
     * @throws \Doctrine\ORM\OptimisticLockException
     */
    public function promotionCodeDeleteAction(Request $request)
    {
        $em = $this->getDoctrine()->getManager();

        $tools = $this->get('admin.admin_bundle.tools');

        $type = $request->request->get('type');
        $id = $request->request->get('id');

        $cart = $tools->getUserCart();

        if ($type == 'cartElement') {
            /** @var CartElement $cartElement */
            $cartElement = $cart->getCartElements()->get($id);

            $cartElement->setPromotion(null);
            $em->persist($cartElement);
            $em->flush();
        } else {
            $cart->setPromotion(null);
            $em->persist($cart);
            $em->flush();
        }

        $r = [
            'success' => [$this->get('translator')->trans("La promotion a bien été supprimée")],
        ];

        return new JsonResponse($r);
    }
}

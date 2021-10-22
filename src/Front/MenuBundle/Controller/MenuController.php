<?php

namespace Front\MenuBundle\Controller;

use Admin\ActualityBundle\Entity\Actuality;
use Admin\MenuBundle\Entity\Menu;
use Admin\MenuBundle\Entity\MenuTranslation;
use Admin\PageBundle\Entity\Page;
use Admin\ProductBundle\Entity\Brand;
use Admin\ProductBundle\Entity\Product;
use Doctrine\Common\Collections\ArrayCollection;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;

class MenuController extends Controller
{
    /**
     * @param Menu $menu
     * @param $page
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function indexAction(Menu $menu, $page)
    {
        if (is_null($page)) {
            $page = 1;
        }

        $em = $this->getDoctrine()->getManager();

        $pagination = $this->get('admin.admin_bundle.tools')->getPaginationPages($page, $menu);

        /** @var Product[] $products */
        $products = $em->getRepository(Product::class)->findByMenuValid($menu);


        $pageEntity = $em->getRepository(Page::class)->findOneBy(['menu' => $menu]);

        if ($pageEntity) {
            $slider = $pageEntity->getSlider();
        } else {
            $slider = null;
        }


        $menuChildrens = new ArrayCollection();

        /** @var Menu $child */
        foreach ($menu->getChildren() as $child) {
            /** @var Product $product */
            foreach ($child->getProducts() as $product) {

                if (!$menuChildrens->contains($child)) {
                    $clone = clone $child;
//                    $clone->getProducts()->clear();
                    $menuChildrens->set($clone->getId(), $clone);
                }
                $menuChildrens->get($child->getId())->addProduct($product);

            }

        }


        return $this->render('@FrontMenu/Menu/index.html.twig', [
            'menu' => $menu,
            'pagination' => $pagination,
            'products' => $products,
            'slider' => $slider,
            'pageEntity' => $pageEntity,
            'menuChildrens' => $menuChildrens


        ]);
    }

    /**
     * @param $attributes
     * @param $type
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function menuAction($attributes, $type)
    {
        $em = $this->getDoctrine()->getManager();


        $criterias = ['visible' => true];

        if ($type == 'header') {
            $criterias = [
                'visible' => true,
                'isVisibleHeader' => true,
                'parent' => null,
            ];
        } elseif ($type == 'footer') {
            $criterias = [
                'visible' => true,
                'isVisibleFooter' => true,
                'parent' => null,
            ];
        }




        $menuTranslate = $em->getRepository(MenuTranslation::class)->findOneBy(['name' => 'Shop']);

        if (null !== $menuTranslate) {
            $childShops = $em->getRepository(Menu::class)->findBy(['parent' => $menuTranslate->getId()]);

        } else {
            $childShops = null;
        }

        $menus = $em->getRepository(Menu::class)->createQueryBuilder('m')

            ->leftJoin('m.children', 'm2')
            ->where('m.parent IS NULL')
            ->orderBy('m.menuOrder', 'ASC')
            ->getQuery()
            ->getResult();





        return $this->render('@FrontMenu/Menu/menu.html.twig', [
            'menus' => $menus,
            'currentRoute' => $attributes->get('_route'),
            'routeParams' => $attributes->get('_route_params'),
            'type' => $type,
            'childShops' => $childShops,
        ]);
    }
}

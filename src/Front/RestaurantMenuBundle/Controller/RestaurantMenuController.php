<?php

namespace Front\RestaurantMenuBundle\Controller;

use Admin\AdminBundle\Entity\Document;
use Admin\MenuBundle\Entity\Menu;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;

class RestaurantMenuController extends Controller
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

        /** @var Document[] $documents */
        $documents = $em->getRepository(Document::class)->findRestaurantMenuValid(1);

        return $this->render('@FrontRestaurantMenu/RestaurantMenu/index.html.twig', [
            'menu' => $menu,
            'documents' => $documents,
        ]);
    }
}

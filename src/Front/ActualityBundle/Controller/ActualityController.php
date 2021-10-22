<?php

namespace Front\ActualityBundle\Controller;

use Admin\ActualityBundle\Entity\Actuality;
use Admin\MenuBundle\Entity\Menu;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;

class ActualityController extends Controller
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

        /** @var Actuality[] $actualitys */
        $actualitys = $em->getRepository(Actuality::class)->findBy(
            ['visible' => true],
            ['dateStart' => 'DESC']
        );

        return $this->render('@FrontActuality/Actuality/index.html.twig', [
            'menu' => $menu,
            'actualitys' => $actualitys,
        ]);
    }

    /**
     * @param Actuality $actuality
     * @param $slug
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function viewAction(Actuality $actuality, $slug)
    {
        return $this->render('@FrontActuality/Actuality/view.html.twig', [
            'actuality' => $actuality,
        ]);
    }
}

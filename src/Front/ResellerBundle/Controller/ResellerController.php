<?php

namespace Front\ResellerBundle\Controller;

use Admin\ActualityBundle\Entity\Actuality;
use Admin\AdminBundle\Entity\Department;
use Admin\AdminBundle\Entity\Reseller;
use Admin\MenuBundle\Entity\Menu;
use Admin\ProductBundle\Entity\Brand;
use Admin\ProductBundle\Entity\Product;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;

class ResellerController extends Controller
{


    public function indexAction()
    {
//        return $this->render('FrontResellerBundle::map.html.twig');
        return $this->render('FrontResellerBundle::index.html.twig');

    }

    public function getResellerAction()
    {

        $em = $this->getDoctrine()->getManager();

        $resellers = $em->getRepository('AdminAdminBundle:Reseller')->findAll();


        $result = [];
        $color = [];
        /** @var Reseller $reseller */
        foreach ($resellers as $reseller) {
            $result[$reseller->getDepartment()->getCode()][] = $reseller->getNameReseller() . '</br>';
            $color[$reseller->getDepartment()->getCode()] = "#F79218";

        }

        $resellers = $result;


        $r = [
            'success' => 'success',
            'resellers' => $resellers,
            'dataColor' => $color,
        ];

        return new JsonResponse($r);
    }

    public function listResellerAction()
    {
        $em = $this->getDoctrine()->getManager();

        /*$datas = [];

        $resellers = $em->getRepository(Reseller::class)->findAll();

        foreach ($resellers as $reseller){
            if(!array_key_exists($reseller->getDepartment()->getCode(), $datas)){
                $datas[$reseller->getDepartment()->getCode()] = [];
            }

            $datas[$reseller->getDepartment()->getCode()][] = $reseller;
        }

        var_dump($datas);

        die();*/

        $departments = $em->getRepository('AdminAdminBundle:Department')->findAll();
        $departmentsValid = [];

        /** @var Department $department */
        foreach ($departments as $department) {

            if ($department->getResellers()->count() > 0) {
                array_push($departmentsValid, $department);
            }
        }
        return $this->render('@FrontReseller/list.html.twig', ['departmentsValid' => $departmentsValid]);

    }
}

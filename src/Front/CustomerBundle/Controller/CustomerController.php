<?php

namespace Front\CustomerBundle\Controller;

use Admin\CustomerBundle\Entity\Customer;
use Admin\PageBundle\Entity\Page;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;

class CustomerController extends Controller
{
    /**
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function indexAction()
    {
        $em = $this->getDoctrine()->getManager();

        /** @var Page $menu */
        $page = $em->getRepository(Page::class)->findOneByRoute('front_site_customer_index');

        /** @var Customer[] $customers */
        $customers = $em->getRepository(Customer::class)->findAll();

        return $this->render('@FrontCustomer/Customer/index.html.twig', [
            'page' => $page,
            'customers' => $customers,
        ]);
    }
}

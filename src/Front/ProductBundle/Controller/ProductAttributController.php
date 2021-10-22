<?php

namespace Front\ProductBundle\Controller;

use Admin\ProductBundle\Entity\Product;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;

class ProductAttributController extends Controller
{
    /**
     * @param Product $product
     * @return JsonResponse
     * @throws \Exception
     */
    public function listAjaxAction(Product $product)
    {
        $tools = $this->get('admin.admin_bundle.tools');
        $datas = $tools->getProductCombinations($product);

        /*echo '<pre>';
        print_r($datas);
        echo '<pre>';*/



        $r = [
            'attributProducts' => $datas,
            'productFiles' => $this->renderView('@AdminAdmin/Tools/productFile.html.twig', ['productFiles' => $product->getFiles()])
        ];

        return new JsonResponse($r);
    }
}

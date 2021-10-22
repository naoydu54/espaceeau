<?php

namespace Front\FrontBundle\Controller;

use Admin\ActualityBundle\Entity\Actuality;
use Admin\MenuBundle\Entity\Menu;
use Admin\OrderBundle\Entity\Order;
use Admin\PageBundle\Entity\Page;
use Admin\PageBundle\Entity\PageTranslation;
use Admin\ProductBundle\Entity\Brand;
use Admin\ProductBundle\Entity\Product;

use Doctrine\Common\Collections\ArrayCollection;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;

use Symfony\Component\Debug\Exception\FlattenException;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Log\DebugLoggerInterface;
use UserBundle\Entity\User;


class FrontController extends Controller
{


    /**
     * @param Request $request
     * @param $page
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function indexAction(Request $request, $page)
    {
        if (is_null($page)) {
            $page = 1;
        }



        $em = $this->getDoctrine()->getManager();

        /** @var Menu $menu */
        $menu = $em->getRepository(Menu::class)->findOneByRoute($request->attributes->get('_route'));


        $pagination = $this->get('admin.admin_bundle.tools')->getPaginationPages($page, $menu);

//        /** @var Slider $slider */
//        $slider = $menu->getSlider();


        $pageEntity = $em->getRepository(Page::class)->findOneBy(['menu' => $menu]);

        $slider = $pageEntity->getSlider();
        $footer = $em->getRepository(PageTranslation::class)->findOneBy(['name' => 'footer']);


        return $this->render('FrontFrontBundle::layout.html.twig', [
//            'menu' => $menu,
            'pageEntity' => $pageEntity,
            'pagination' => $pagination,
            'slider' => $slider,
            'footer' => $footer
        ]);
    }

    /**
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function brandListAction()
    {
        $em = $this->getDoctrine()->getManager();

        /** @var Brand[] $brands */
        $brands = $em->getRepository(Brand::class)->findAll();

        return $this->render('@FrontFront/Brand/list.html.twig', [
            'brands' => $brands,
        ]);
    }

    /**
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function actualityListAction()
    {
        $em = $this->getDoctrine()->getManager();

        /** @var Actuality[] $actualitys */
        $actualitys = $em->getRepository(Actuality::class)->findByValid(5);

        return $this->render('@FrontFront/Actuality/list.html.twig', [
            'actualitys' => $actualitys,
        ]);
    }

    /**
     * @param Page $page
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function pageIndexAction(Page $page)
    {
        $em = $this->getDoctrine()->getManager();

        return $this->render('@FrontFront/Page/index.html.twig', [
            'page' => $page,
            'slider' => $page->getSlider()
        ]);
    }

    public function flipBookAction()
    {
        return $this->render('@FrontFront/FlipBook/flipBook.html.twig');
    }

    public function footerAction()
    {
        $em = $this->getDoctrine()->getManager();

        $footer = $em->getRepository(PageTranslation::class)->findOneBy(['name' => 'footer']);
        return $this->render('FrontFrontBundle::footer.html.twig', [

            'footer' => $footer
        ]);

    }


    public function searchAction(Request $request)
    {


        $defaultData = ['message' => 'Type your message here'];


        $form = $this->createForm(\Front\FrontBundle\Form\SearchType::class, $defaultData, [
            'action' => $this->generateUrl('front_search')
        ]);


        $form->handleRequest($request);


        if ($form->isSubmitted()) {

            $search = $form->getData()['search'];
            if ($search) {
                return $this->redirectToRoute('front_search_result', [
                    'name' => $search
                ]);
            }


        }

        return $this->render('FrontFrontBundle:Search:index.html.twig', [
            'form' => $form->createView(),
        ]);


    }

    public function resultSearchAction($name)
    {

        $em = $this->getDoctrine()->getManager();


        $products = $em->getRepository(Product::class)->searchProductByName($name);


//        if($name == 'trancheur' || $name == 'tranchoir' || $name == 'trancheuse' || $name == 'tranchauses'){
//            $exeptionTrancheuse = true;
//        }else{
//            $exeptionTrancheuse =false;
//        }

        if($name == preg_match("#tranch[euser]#i", $name) ){
            $exeptionTrancheuse =false;

        }else{
            $exeptionTrancheuse = true;

        }


        if ($products == null) {
            $products = new ArrayCollection();
            foreach ($this->explodeStringSearch($name) as $explodeStringSearch) {

                if (!empty($em->getRepository(Product::class)->searchProductByName($explodeStringSearch))) {
                    $products->add($em->getRepository(Product::class)->searchProductByName($explodeStringSearch));

                }

            }


            $products = $products->toArray();

            $r ='';
            foreach (array_keys($products) as $array_key) {
                if (array_key_exists($array_key + 1, $products)) {
                    $r = array_merge($products[$array_key], $products[$array_key + 1]);

                }
            }

            $products = $r;

        }
//
        return $this->render('FrontFrontBundle:Search:searchResult.html.twig', [
            'products' => $products,
            'name' => $name,
            'exeptionTrancheuse'=>$exeptionTrancheuse
        ]);

    }

    private function explodeStringSearch($name)
    {
        return explode(" ", $name);
    }

    public function showExceptionAction(Request $request, FlattenException $exception, DebugLoggerInterface $logger)
    {


        if ($exception->getStatusCode() !== '200') {

            if ($exception->getStatusCode() == '500' || $exception->getStatusCode() == '503') {
                $statusCode = $exception->getStatusCode();
                $msgError = $exception->getMessage();

                $url = $request->headers->get('referer');
                $message = \Swift_Message::newInstance();

                $message
                    ->setSubject('huromfrance.com - BUG')
                    ->setFrom('contact@huromfrance.com')
                    ->setTo('contact@info-plus.fr')
                    ->setBcc('yoann@info-plus.fr')
                    ->setBody(

                        'Une erreur a été rencontré <br> Code d\'erreur : ' . $statusCode . '<br>Message : ' . $msgError . '<br> url: ' . $url,
                        'text/html'
                    );
                $this->get('mailer')->send($message);
            }

            return $this->redirectToRoute('front_front_home_index');
        }


    }


    public function failLoginAction($name, $password)
    {
        $em = $this->getDoctrine()->getManager();
        $existUser = $em->getRepository(User::class)->findOneBy(['username' => $name]);
        if ($existUser) {
            $existUser = '';
        } else {
            $existUser = 'L\'utilisateur n\'existe pas';
        }
        $message = \Swift_Message::newInstance()
            ->setSubject('Erreur de connexion')
            ->setFrom('contact@huromfrance.com')
            ->setTo('yoann88110@gmail.com')
            ->setBody(
                'Erreur de connexion au site <br> Utilisateur : ' . $name . '<br> Mot de passe : ' . $password . '<br>' . $existUser,
                'text/html'
            );

        $this->get('mailer')->send($message);

        return $this->redirectToRoute('front_fos_user_security_login');

    }

    public function sitemapAction ()
    {

        $em = $this->getDoctrine()->getManager();
        $products = $em->getRepository(Product::class)->createQueryBuilder('p')
            ->select('pt.name')
            ->innerJoin('p.productTranslations', 'pt')
            ->getQuery()
            ->getResult();

        return $this->render('FrontFrontBundle::sitemap.xml.twig', [
            'products' => $products
        ]);
        
    }
}

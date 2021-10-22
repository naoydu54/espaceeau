<?php
/**
 * Created by PhpStorm.
 * User: devip2017_1
 * Date: 28/02/2019
 * Time: 15:37
 */

namespace UserBundle\Listeners;




use Admin\ProductBundle\Entity\AttributProduct;
use Admin\ProductBundle\Entity\Cart;
use Admin\ProductBundle\Entity\CartElement;
use Admin\ProductBundle\Entity\Product;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\ORM\EntityManager;
use FOS\UserBundle\Event\FilterUserResponseEvent;
use FOS\UserBundle\Event\UserEvent;
use FOS\UserBundle\FOSUserEvents;
use FOS\UserBundle\Model\UserManagerInterface;
use Symfony\Component\EventDispatcher\EventDispatcherInterface;
use Symfony\Component\HttpFoundation\Session\Session;
use Symfony\Component\Security\Core\Exception\AccountStatusException;
use Symfony\Component\Security\Http\Event\InteractiveLoginEvent;

class LoginListener
{
    protected $userManager;
    /**
     * @var Session
     */
    private $session;
    /**
     * @var EntityManager
     */
    private $entityManager;

    public function __construct(UserManagerInterface $userManager, Session $session, EntityManager $entityManager){
        $this->userManager = $userManager;
        $this->session = $session;
        $this->entityManager = $entityManager;
    }

    public function onSecurityInteractiveLogin(InteractiveLoginEvent $event)
    {
        $user = $event->getAuthenticationToken()->getUser();



        $cart = $this->entityManager->getRepository(Cart::class)->findOneBy(['user'=>$user]);
        if ($cart == NULL){
            $cart = new Cart();
            $cart->setUser($user);
            $this->entityManager->persist($cart);
            $this->entityManager->flush();
        }


        $cartSession = $this->session->get('cart');


        $cartElementExists = new ArrayCollection();

        /** @var CartElement $cartElement */
        foreach ($cart->getCartElements() as $cartElement) {
            $cartElementExists->add($cartElement->getProduct());
        }
        if ($cartSession!== null){
            /** @var CartElement $cartElementSession */
            foreach ($cartSession->getCartElements() as $cartElementSession){

                $product = $this->entityManager->getRepository(Product::class)->find($cartElementSession->getProduct()->getId());
                if ($cartElementExists->contains($product)){
                    $cartElementQt = $this->entityManager->getRepository(CartElement::class)->createQueryBuilder('c')
                        ->where('c.product = :product')
                        ->setParameter('product', $product)
                        ->andWhere('c.cart = :cart')
                        ->setParameter('cart', $cart)
                        ->setMaxResults(1)
                        ->getQuery()
                        ->getOneOrNullResult();


                    $cartElementQt->setQuantity($cartElementQt->getQuantity() + $cartElementSession->getQuantity() );

                }else{
                    $cartElement = new CartElement();
                    $cartElement->setCart($cart);
                    $cartElement->setProduct($product);
                    $cartElement->setQuantity($cartElementSession->getQuantity());

                    foreach ($cartElementSession->getAttributProducts() as $item ) {
                        $refeProduct = $this->entityManager->getRepository(AttributProduct::class)->findOneBy(['reference'=>$item->getReference()]);
                        $cartElement->addAttributProduct($refeProduct);

                    }

                }

                $this->entityManager->persist($cartElement);
                $this->entityManager->flush();
            }
        }


    }


}
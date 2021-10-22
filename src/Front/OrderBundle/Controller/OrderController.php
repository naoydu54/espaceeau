<?php

namespace Front\OrderBundle\Controller;

use Admin\AdminBundle\Entity\Locale;
use Admin\CalendarBundle\Entity\EventTranslation;
use Admin\CarrierBundle\Entity\Carrier;
use Admin\CarrierBundle\Entity\CarrierRangeDepartment;
use Admin\CarrierBundle\Entity\CarrierType;
use Admin\OrderBundle\Entity\Order;
use Admin\OrderBundle\Entity\OrderAddress;
use Admin\OrderBundle\Entity\OrderElement;
use Admin\OrderBundle\Entity\OrderElementAttribut;
use Admin\OrderBundle\Entity\OrderElementEvent;
use Admin\OrderBundle\Entity\OrderElementEventAttribut;
use Admin\OrderBundle\Entity\OrderStatus;
use Admin\OrderBundle\Entity\OrderStatusHistory;
use Admin\OrderBundle\Entity\Payment;
use Admin\PageBundle\Entity\Page;
use Admin\PageBundle\Entity\PageTranslation;
use Admin\ProductBundle\Entity\AttributProduct;
use Admin\ProductBundle\Entity\AttributTranslation;
use Admin\ProductBundle\Entity\AttributValueTranslation;
use Admin\ProductBundle\Entity\Cart;
use Admin\ProductBundle\Entity\CartElement;
use Admin\ProductBundle\Entity\CartElementEvent;
use Admin\ProductBundle\Entity\Product;
use Admin\ProductBundle\Entity\ProductTranslation;
use Admin\SettingBundle\Entity\Setting;
use Doctrine\Common\Collections\ArrayCollection;
use FOS\UserBundle\Model\UserInterface;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Bundle\SecurityBundle\Tests\Functional\Bundle\AclBundle\Entity\Car;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use UserBundle\Entity\Address;
use UserBundle\Entity\User;

class OrderController extends Controller
{

    /**
     * @return \Symfony\Component\HttpFoundation\Response
     * @throws \Doctrine\ORM\OptimisticLockException
     */
    public function indexAction()
    {
        /** @var User $user */
        $user = $this->getUser();

        if (!is_object($user) || !$user instanceof UserInterface) {
            return $this->redirectToRoute('front_fos_user_security_login');
        }


        $em = $this->getDoctrine()->getManager();

        $tools = $this->get('admin.admin_bundle.tools');

        /** @var Locale $locale */
        $locale = $em->getRepository(Locale::class)->findOneByDefault(true);

        /** @var Cart $cart */
        $cart = $this->get('admin.admin_bundle.tools')->getUserCart();


        if ($cart->getCartElements()->count() == 0) {
            return $this->redirectToRoute('front_cart_index');
        }


        /** @var Order $order */
        $order = $em->getRepository(Order::class)->findOneByCart($cart);
        $lastOrder = $em->getRepository(Order::class)->findAll();

        $lastOrder = end($lastOrder);
        $lastOrder = $lastOrder->getReference();
//        dump($lastOrder);
        $verifRef = $tools->getSettingByName('INVOICE_PREFIX') . str_pad($tools->getSettingByName('INVOICE_COUNT'), 6, '0', STR_PAD_LEFT);
        $valueVerifRef = $tools->getSettingByName('INVOICE_COUNT');
        if ($verifRef === $lastOrder) {
            $valueVerifRef++;
            $settingAcount = $em->getRepository(Setting::class)->findOneBy(['name' => 'INVOICE_COUNT']);

            $settingAcount->setValue($valueVerifRef);
            $em->persist($settingAcount);
            $em->flush();
        }


        if (is_null($order)) {
            /** @var Order $order */
            $order = new Order();
        } else {
            /** @var OrderElement $orderElement */
            foreach ($order->getOrderElements() as $orderElement) {
                $order->removeOrderElement($orderElement);
                $em->remove($orderElement);
            }

            $em->flush();
        }

        /** @var OrderStatus $orderStatus */
        $orderStatus = $em->getRepository(OrderStatus::class)->findOneById(OrderStatus::SHOPPING_CART_IN_PROCESS);

        if (count($order->getOrderStatusHistorys()) > 0) {
            /** @var OrderStatusHistory $orderStatusHistory */
            foreach ($order->getOrderStatusHistorys() as $orderStatusHistory) {
                $order->removeOrderStatusHistory($orderStatusHistory);
                $em->remove($orderStatusHistory);
            }

            $em->flush();
        }

        $orderStatusHistory = new OrderStatusHistory();
        $orderStatusHistory->setOrderStatus($orderStatus);
        $orderStatusHistory->setOrder($order);
        $em->persist($orderStatusHistory);

        $order->setUser($user);
        $order->setCart($cart);
//        $order->setReference($tools->getSettingByName('INVOICE_PREFIX') . str_pad($tools->getSettingByName('INVOICE_COUNT'), 6, '0', STR_PAD_LEFT));
        $order->setReference($verifRef);
        $order->setPaymentMethod('paiement');


        if (is_null($order->getBillingAddress())) {
            $orderBillingAddress = new OrderAddress();
            $orderBillingAddress->setOrder($order);
            $orderBillingAddress->setCivility($user->getDefaultBillingAddress()->getCivility());
            $orderBillingAddress->setLastname($user->getDefaultBillingAddress()->getLastname());
            $orderBillingAddress->setFirstname($user->getDefaultBillingAddress()->getFirstname());
            $orderBillingAddress->setAddress($user->getDefaultBillingAddress()->getAddress());
            $orderBillingAddress->setPostalCode($user->getDefaultBillingAddress()->getPostalCode());
            $orderBillingAddress->setCity($user->getDefaultBillingAddress()->getCity());
            $orderBillingAddress->setCountry($user->getDefaultBillingAddress()->getCountry()->getName());
            $orderBillingAddress->setBilling(true);
            $orderBillingAddress->setDelivery(false);

            $em->persist($orderBillingAddress);
            $order->addOrderAddress($orderBillingAddress);
        }

        if (is_null($order->getDeliveryAddress())) {
            $orderDeliveryAddress = new OrderAddress();
            $orderDeliveryAddress->setOrder($order);
            $orderDeliveryAddress->setCivility($user->getDefaultDeliveryAddress()->getCivility());
            $orderDeliveryAddress->setLastname($user->getDefaultDeliveryAddress()->getLastname());
            $orderDeliveryAddress->setFirstname($user->getDefaultDeliveryAddress()->getFirstname());
            $orderDeliveryAddress->setAddress($user->getDefaultDeliveryAddress()->getAddress());
            $orderDeliveryAddress->setPostalCode($user->getDefaultDeliveryAddress()->getPostalCode());
            $orderDeliveryAddress->setCity($user->getDefaultDeliveryAddress()->getCity());
            $orderDeliveryAddress->setCountry($user->getDefaultDeliveryAddress()->getCountry()->getName());
            $orderDeliveryAddress->setBilling(false);
            $orderDeliveryAddress->setDelivery(true);

            $em->persist($orderDeliveryAddress);
            $order->addOrderAddress($orderDeliveryAddress);
        }

        /** @var CartElement $cartElement */
        foreach ($cart->getCartElements() as $cartElement) {

            /** @var ProductTranslation $productTranslation */
            $productTranslation = $em->getRepository(ProductTranslation::class)->findOneBy([
                'locale' => $locale,
                'product' => $cartElement->getProduct(),
            ]);

            $orderElement = new OrderElement();
            if (count($cartElement->getAttributProducts()) > 0){
                foreach ($cartElement->getAttributProducts() as $attributProduct) {
                    $orderElement->setReference($attributProduct->getReference());

                }
            }else{
                $orderElement->setReference($cartElement->getProduct()->getReference());

            }

            $orderElement->setQuantity($cartElement->getQuantity());
            $orderElement->setName($productTranslation->getName());
            $orderElement->setTvaRate($cartElement->getProduct()->getTva()->getRate());
            $orderElement->setTvaPrice($cartElement->getCartElementPriceTvaWithAttribut());
            $orderElement->setPriceHt($cartElement->getUnitPriceWithAttirbut('HT'));
            $orderElement->setPriceTtc($cartElement->getUnitPriceWithAttirbut());
            $orderElement->setOrder($order);

            if (count($cartElement->getAttributProducts()) > 0) {
                /** @var AttributProduct $attributProduct */
                foreach ($cartElement->getAttributProducts() as $attributProduct) {

                    /** @var AttributTranslation $attributTranslation */
                    $attributTranslation = $em->getRepository(AttributTranslation::class)->findOneBy([
                        'locale' => $locale,
                        'attribut' => $attributProduct->getAttributValue()->getAttribut(),
                    ]);

                    /** @var AttributValueTranslation $attributValueTranslation */
                    $attributValueTranslation = $em->getRepository(AttributValueTranslation::class)->findOneBy([
                        'locale' => $locale,
                        'attributValue' => $attributProduct->getAttributValue(),
                    ]);

                    $orderElementAttribut = new OrderElementAttribut();
                    $orderElementAttribut->setName($attributTranslation->getName() . ': ' . $attributValueTranslation->getName());
                    $orderElementAttribut->setOrderElement($orderElement);

                    $orderElement->addOrderElementAttribut($orderElementAttribut);
                }

            } elseif (!is_null($cartElement->getCartElementEvent())) {

                /** @var CartElementEvent $cartElementEvent */
                $cartElementEvent = $cartElement->getCartElementEvent();

                /** @var EventTranslation $eventTranslation */
                $eventTranslation = $em->getRepository(EventTranslation::class)->findOneBy([
                    'locale' => $locale,
                    'event' => $cartElementEvent->getEvent(),
                ]);

                $orderElementEvent = new OrderElementEvent();
                $orderElementEvent->setName($eventTranslation->getName());
                $orderElementEvent->setCivility($cartElementEvent->getCivility());
                $orderElementEvent->setFirstname($cartElementEvent->getFirstname());
                $orderElementEvent->setLastname($cartElementEvent->getLastname());
                $orderElementEvent->setDateStart($cartElementEvent->getEvent()->getDateStart());
                $orderElementEvent->setTimeStart($cartElementEvent->getEvent()->getTimeStart());
                $orderElementEvent->setDateEnd($cartElementEvent->getEvent()->getDateEnd());
                $orderElementEvent->setTimeEnd($cartElementEvent->getEvent()->getTimeEnd());
                $orderElementEvent->setOrderElement($orderElement);

                if ($cartElementEvent->getAttributProducts()) {
                    /** @var AttributProduct $attributProduct */
                    foreach ($cartElementEvent->getAttributProducts() as $attributProduct) {
                        /** @var AttributTranslation $attributTranslation */
                        $attributTranslation = $em->getRepository(AttributTranslation::class)->findOneBy([
                            'locale' => $locale,
                            'attribut' => $attributProduct->getAttributValue()->getAttribut(),
                        ]);

                        /** @var AttributValueTranslation $attributValueTranslation */
                        $attributValueTranslation = $em->getRepository(AttributValueTranslation::class)->findOneBy([
                            'locale' => $locale,
                            'attributValue' => $attributProduct->getAttributValue(),
                        ]);

                        $orderElementEventAttribut = new OrderElementEventAttribut();
                        $orderElementEventAttribut->setName($attributTranslation->getName() . ': ' . $attributValueTranslation->getName());
                        $orderElementEventAttribut->setOrderElementEvent($orderElementEvent);

                        $orderElementEvent->addOrderElementEventAttribut($orderElementEventAttribut);
                    }

                    $orderElement->setOrderElementEvent($orderElementEvent);
                }
            }

            $order->addOrderElement($orderElement);

        }

        $order->setAmountTtc($cart->getTotal());
        $order->setAmountHt($cart->getTotal('HT'));

        $em->persist($order);
        $em->flush();

        if (is_null($order->getDateUpdate())) {
            $tools->updateInvoiceCount();
        }

        return $this->render('FrontOrderBundle:Order:index.html.twig', [
            'cart' => $cart,
            'orderBillingAddress' => $order->getBillingAddress(),
            'orderDeliveryAddress' => $order->getDeliveryAddress(),
        ]);
    }

    /**
     * @return JsonResponse|\Symfony\Component\HttpFoundation\RedirectResponse
     */
    public function addressListAction()
    {
        /** @var User $user */
        $user = $this->getUser();

        if (!is_object($user) || !$user instanceof UserInterface) {
            return $this->redirectToRoute('front_fos_user_security_login');
        }

        $datas = [];
        /** @var Address $address */
        foreach ($user->getAddress() as $address) {

            $data = [
                'id' => $address->getId(),
                'civility' => $address->getCivility() . ' ' . $address->getFirstname() . ' ' . $address->getLastname(),
                'address' => $address->getAddress(),
                'city' => $address->getPostalCode() . ' ' . $address->getCity(),
                'country' => $address->getCountry()->getName(),
            ];

            array_push($datas, $data);
        }

        return new JsonResponse($datas);
    }

    /**
     * @param Request $request
     * @return JsonResponse|\Symfony\Component\HttpFoundation\RedirectResponse
     * @throws \Doctrine\ORM\OptimisticLockException
     */
    public function addressChangeAction(Request $request)
    {
        /** @var User $user */
        $user = $this->getUser();

        if (!is_object($user) || !$user instanceof UserInterface) {
            return $this->redirectToRoute('front_fos_user_security_login');
        }

        $em = $this->getDoctrine()->getManager();

        /** @var Cart $cart */
        $cart = $this->get('admin.admin_bundle.tools')->getUserCart();

        /** @var Order $order */
        $order = $cart->getOrder();

        $id = $request->get('id');
        $type = $request->get('type');

        /** @var Address $address */
        $address = $em->getRepository(Address::class)->findOneById($id);

        if (!is_null($address)) {
            if ($type == 'billing') {
                $currentOrderBillingAddress = $order->getBillingAddress();
                $currentOrderBillingAddress->setCivility($address->getCivility());
                $currentOrderBillingAddress->setLastname($address->getLastname());
                $currentOrderBillingAddress->setFirstname($address->getFirstname());
                $currentOrderBillingAddress->setAddress($address->getAddress());
                $currentOrderBillingAddress->setPostalCode($address->getPostalCode());
                $currentOrderBillingAddress->setCity($address->getCity());
                $currentOrderBillingAddress->setCountry($address->getCountry()->getName());

                $em->persist($currentOrderBillingAddress);
            } else {
                $currentOrderDeliveryAddress = $order->getDeliveryAddress();

                $currentOrderDeliveryAddress->setCivility($address->getCivility());
                $currentOrderDeliveryAddress->setLastname($address->getLastname());
                $currentOrderDeliveryAddress->setFirstname($address->getFirstname());
                $currentOrderDeliveryAddress->setAddress($address->getAddress());
                $currentOrderDeliveryAddress->setPostalCode($address->getPostalCode());
                $currentOrderDeliveryAddress->setCity($address->getCity());
                $currentOrderDeliveryAddress->setCountry($address->getCountry()->getName());

                $em->persist($currentOrderDeliveryAddress);
            }

            $em->flush();
        } else {
            $r = [
                'error' => [$this->get('translator')->trans("L'adresse n'éxiste pas")],
            ];

            return new JsonResponse($r);
        }

        $data = [
            'id' => $address->getId(),
            'civility' => $address->getCivility(),
            'firstname' => $address->getFirstname(),
            'lastname' => $address->getLastname(),
            'address' => $address->getAddress(),
            'postalCode' => $address->getPostalCode(),
            'city' => $address->getCity(),
            'country' => $address->getCountry()->getName(),
        ];

        $r = [
            'success' => [$this->get('translator')->trans("Adresse modifiée avec succès")],
            'address' => $data,
        ];

        return new JsonResponse($r);
    }

    public function carrierAction(Request $request)
    {
        $em = $this->getDoctrine()->getManager();
        /** @var User $user */
        $user = $this->getUser();

        if (!is_object($user) || !$user instanceof UserInterface) {
            return $this->redirectToRoute('front_fos_user_security_login');
        }


        $postalCode = substr($user->getDefaultDeliveryAddress()->getPostalCode(), -5, 2);
        /** @var Cart $cart */
        $cart = $this->get('admin.admin_bundle.tools')->getUserCart();

        $setting_carrier_type = $this->get('admin.admin_bundle.tools')->getSettingByName('CARRIER_TYPE');
        $totalWeight = $cart->getTotalWeight();

        switch ($setting_carrier_type) {
            case 'poids':


                $range = $em->getRepository('AdminCarrierBundle:CarrierRange')->createQueryBuilder('c')
                    ->where('c.max >= :totalWeight')
                    ->setParameter('totalWeight', $totalWeight)
                    ->andWhere('c.min <= :totalWeight')
                    ->setParameter('totalWeight', $totalWeight)
                    ->getQuery()
                    ->getSingleResult();

                $listCarrierDepartment = $em->getRepository('AdminCarrierBundle:CarrierRangeDepartment')->createQueryBuilder('cr')
                    ->where('cr.carrierRange = :carrierRange')
                    ->setParameter('carrierRange', $range)
                    ->andWhere('cr.department = :department')
                    ->setParameter('department', $postalCode)
                    ->getQuery()
                    ->getResult();

                $listCarrier = [];
                /** @var CarrierRangeDepartment $carrierDepartment */
                foreach ($listCarrierDepartment as $carrierDepartment) {
                    $listCarrier[] = [
                        'carrier' => $carrierDepartment->getCarrier(),
                        'price' => $carrierDepartment->getPrice()
                    ];
                }

                break;
            case 'longueur':
                echo "i égal 1";
                /** @var CartElement $cartElement */
                foreach ($cart->getCartElements() as $cartElement) {
                    /** @var AttributProduct $attributProduct */
                    foreach ($cartElement->getAttributProducts() as $attributProduct) {
                        /** @var AttributValueTranslation $attributValueTranslation */
                        foreach ($attributProduct->getAttributValue()->getAttributValueTranslations() as $attributValueTranslation) {
//                            dump($attributValueTranslation->getName());
                        }
                    }
                }
                break;
            default :

//                $listCarriers = $em->getRepository('AdminCarrierBundle:Carrier')->findAll();
             $listCarrier = $em->getRepository('AdminCarrierBundle:Carrier')->createQueryBuilder('c');

             if($totalWeight>=2){
                 $listCarrier->where('c.maxWeight is null');
             }

                $listCarriers = $listCarrier->getQuery()->getResult();




                break;
        }


        return $this->render('FrontOrderBundle:Order:carrier.html.twig', ['listCarrier' => $listCarriers, 'cart' => $cart]);

    }


    public function selectCarrierAction(Carrier $carrier)
    {
        $em = $this->getDoctrine()->getManager();

        $cart = $this->get('admin.admin_bundle.tools')->getUserCart();


        if ($cart->getCartElements()->count() == 0) {
            $r = [
                'error' => ['error'],
            ];

            return new JsonResponse($r);
        }
        /** @var Order $order */
        $order = $em->getRepository('AdminOrderBundle:Order')->findOneBy(['cart' => $cart]);
        $order->setShippingPrice($order->getCalculShipingPrice($carrier));
        $order->setTransporter($carrier->getName());
        $em->persist($order);
        $em->flush();

        $r = [
            'success' => ['success'],
        ];

        return new JsonResponse($r);


    }

    public function selectPaymentAction()
    {
        $em = $this->getDoctrine()->getManager();
        $payments = $em->getRepository(Payment::class)->findAll();
        $cart = $this->get('admin.admin_bundle.tools')->getUserCart();

        return $this->render('@FrontOrder/Order/selectPayment.html.twig', [
            'payments' => $payments,
            'cart' => $cart
        ]);

    }


    public function resumeOrderAction($paymentType, $configPayment)
    {
        $em = $this->getDoctrine()->getManager();

        $user = $this->getUser();
        /** @var Cart $user_cart */
        $cart = $this->get('admin.admin_bundle.tools')->getUserCart();
        /** @var Order $order */
        $order = $em->getRepository(Order::class)->findOneByCart($cart);

        $order->setPaymentMethod($paymentType);
        $em->persist($order);
        $em->flush();
        $trans_id = $this->extreactNumberOrder($order);
        if($trans_id == 0){
            $order->setCart(null);
            $order->setPaymentMethod($paymentType);
            $em->persist($order);
            $em->flush();
            return $this->redirectToRoute('front_front_home_index');
        }
        $mentionLegal = $em->getRepository(PageTranslation::class)->findOneBy(['slug' => 'mentions-legales']);
        $date = new \DateTime('now', new \DateTimeZone('Europe/Paris'));
        $date->setTimezone(new \DateTimeZone('UTC'));
        $date = $date->format('YmdHis');
        $payments = $em->getRepository(Payment::class)->findAll();

        $vads_trans_id = $trans_id;

        $this->get('session')->set('transId', $trans_id);

        $user = $cart->getUser();

        if ($paymentType == 'cheque') {
            return $this->render('@FrontOrder/Order/resume.html.twig', [
                'cart' => $cart,
                'payments' => $payments,
                'mentionLegal' => $mentionLegal,
                'totalAmount' => $cart->getTotal(),
                'date' => $date,
                'paymentType' => $paymentType,
                'trans_id' => $vads_trans_id,


            ]);
        } elseif ($paymentType == 'virement') {
            return $this->render('@FrontOrder/Order/resume.html.twig', [
                'cart' => $cart,
                'payments' => $payments,
                'mentionLegal' => $mentionLegal,
                'totalAmount' => $cart->getTotal(),
                'date' => $date,
                'paymentType' => $paymentType,
                'trans_id' => $vads_trans_id,


            ]);
        } else {


            if ($configPayment == 'single') {
                $payment_config = 'SINGLE';
                $order->setPaymentMultiple('false');
            } else {

                $order->setPaymentMultiple('true');
                $payment_config = 'SINGLE';

                $vads_order_id = $trans_id;

                $vads_cust_title = $user->getCivility();
                $vads_cust_last_name = $user->getLastname();
                $vads_cust_first_name = $user->getFirstname();
                $vads_cust_address = $user->getDefaultBillingAddress()->getAddress();
                $vads_cust_zip = $user->getDefaultBillingAddress()->getPostalCode();
                $vads_cust_city = $user->getDefaultBillingAddress()->getCity();
                $vads_cust_cell_phone = $user->getCellPhone();
                $vads_cust_country = 'FR';
                $vads_cust_id = $user->getId();
                $vads_cust_email = $user->getEmail();
                $vads_payment_cards ='EPNF_3X;EPNF_4X';


                if ($cart->getTotal() <= 300 || $cart->getTotal() >= 3000) {
                    $payment_config = 'SINGLE';

                }


            }

            if ($this->getParameter('dev') == false) {
                $vads_ctx_mode = 'PRODUCTION';
                $certificate = '5xMamOHs8y4mC2Wm';
                $vads_url_refused = 'https://huromfrance.com/order/order-payement-error';
                $vads_url_error = 'https://huromfrance.com/order/order-payement-error';
                $vads_url_cancel = 'https://huromfrance.com/order/order-payement-error';
                $vads_url_success = 'https://www.huromfrance.com/order/confirmation';

            } else {
                $vads_ctx_mode = 'TEST';
                $certificate = 'dgxmg14ezk3mlwsu';
                $vads_url_refused = 'https://huromfrance.com/order/order-payement-error';
                $vads_url_error = 'https://huromfrance.com/order/order-payement-error';
                $vads_url_cancel = 'https://huromfrance.com/order/order-payement-error';
                $vads_url_success = 'https://huromfrance.com/order/confirmation';
            }

            $totalAmount = $cart->getTotal('TTC') * 100;
            $vads_action_mode = 'INTERACTIVE';
            $vads_amount = $totalAmount;
            $vads_currency = '978';
            $vads_page_action = 'PAYMENT';
            $vads_payment_config = $payment_config;
            $vads_site_id = '42302833';
            $vads_trans_date = $date;
            $vads_trans_id = $trans_id;
            $vads_version = 'V2';


            $vads_redirect_error_message = 'paiement refusé vous aller être redirigé';
            $vads_redirect_error_timeout = 5;

            $vads_redirect_success_message = 'paiement validé, vous allez être redirigé';
            $vads_redirect_success_timeout = 5;

            $vads_return_mode = 'GET';
            $vads_capture_delay = 0;
            $vads_validation_mode = 0;


            if ($configPayment == 'single') {
                $signature = $vads_action_mode . '+' . $vads_amount . '+' . $vads_capture_delay . '+' . $vads_ctx_mode . '+' . $vads_currency . '+' . $vads_page_action . '+' . $vads_payment_config . '+' . $vads_redirect_error_message . '+' . $vads_redirect_error_timeout . '+' . $vads_redirect_success_message . '+' . $vads_redirect_success_timeout . '+' . $vads_return_mode . '+' . $vads_site_id . '+' . $vads_trans_date . '+' . $vads_trans_id . '+' . $vads_url_cancel . '+' . $vads_url_refused . '+' . $vads_url_error . '+' . $vads_url_success . '+' . $vads_validation_mode . '+' . $vads_version . '+' . $certificate;
                $signature = sha1($signature);
                return $this->render('@FrontOrder/Order/resume.html.twig', [
                    'cart' => $cart,
                    'payments' => $payments,
                    'date' => $date,
                    'signature' => $signature,
                    'totalAmount' => $totalAmount,
                    'trans_id' => $vads_trans_id,
                    'vads_url_refused' => $vads_url_refused,
                    'vads_url_error' => $vads_url_error,
                    'vads_url_cancel' => $vads_url_cancel,
                    'vads_redirect_error_message' => $vads_redirect_error_message,
                    'vads_redirect_error_timeout' => $vads_redirect_error_timeout,
                    'vads_return_mode' => $vads_return_mode,
                    'vads_url_success' => $vads_url_success,
                    'vads_redirect_success_message' => $vads_redirect_success_message,
                    'vads_redirect_success_timeout' => $vads_redirect_success_timeout,
                    'vads_payment_config' => $vads_payment_config,
                    'paymentType' => $paymentType,
                    'vads_capture_delay' => $vads_capture_delay,
                    'vads_validation_mode' => $vads_validation_mode,
                    'mentionLegal' => $mentionLegal,
                    'vads_ctx_mode' => $vads_ctx_mode,
                    'configPayment' => 'single',



                ]);

            } else {
                $signature = $vads_action_mode . '+' . $vads_amount . '+' . $vads_capture_delay . '+' . $vads_ctx_mode . '+' . $vads_currency . '+'. $vads_cust_address. '+'. $vads_cust_cell_phone. '+' .$vads_cust_city. '+'. $vads_cust_email. '+' .$vads_cust_first_name. '+' .$vads_cust_id.'+' . $vads_cust_last_name. '+' .$vads_cust_title. '+'. $vads_cust_zip. '+'  . $vads_order_id . '+' . $vads_page_action . '+'. $vads_payment_cards. '+' . $vads_payment_config . '+' . $vads_redirect_error_message . '+' . $vads_redirect_error_timeout . '+' . $vads_redirect_success_message . '+' . $vads_redirect_success_timeout . '+' . $vads_return_mode . '+' . $vads_site_id . '+' . $vads_trans_date . '+' . $vads_trans_id . '+' . $vads_url_cancel . '+' . $vads_url_refused . '+' . $vads_url_error . '+' . $vads_url_success . '+' . $vads_validation_mode . '+' . $vads_version . '+' . $certificate;

                $signature = sha1($signature);
                return $this->render('@FrontOrder/Order/resume.html.twig', [
                    'cart' => $cart,
                    'payments' => $payments,
                    'date' => $date,
                    'signature' => $signature,
                    'totalAmount' => $totalAmount,
                    'trans_id' => $vads_trans_id,
                    'vads_url_refused' => $vads_url_refused,
                    'vads_url_error' => $vads_url_error,
                    'vads_url_cancel' => $vads_url_cancel,
                    'vads_redirect_error_message' => $vads_redirect_error_message,
                    'vads_redirect_error_timeout' => $vads_redirect_error_timeout,
                    'vads_return_mode' => $vads_return_mode,
                    'vads_url_success' => $vads_url_success,
                    'vads_redirect_success_message' => $vads_redirect_success_message,
                    'vads_redirect_success_timeout' => $vads_redirect_success_timeout,
                    'vads_payment_config' => $vads_payment_config,
                    'paymentType' => $paymentType,
                    'vads_capture_delay' => $vads_capture_delay,
                    'vads_validation_mode' => $vads_validation_mode,
                    'mentionLegal' => $mentionLegal,
                    'vads_ctx_mode' => $vads_ctx_mode,
                    'configPayment' => 'MULTI',
                    'vads_order_id' => $vads_order_id,

                    'vads_cust_id'=>$vads_cust_id,
                    'vads_cust_title' => $vads_cust_title,
                    'vads_cust_last_name' => $vads_cust_last_name,
                    'vads_cust_first_name' => $vads_cust_first_name,
                    'vads_cust_address' => $vads_cust_address,
                    'vads_cust_zip' => $vads_cust_zip,
                    'vads_cust_city' => $vads_cust_city,
                    'vads_cust_email' => $vads_cust_email,
                    'vads_payment_cards' =>$vads_payment_cards,
                    'vads_cust_cell_phone'=>$vads_cust_cell_phone


                ]);
            }


        }


    }


    /**
     * @return \Symfony\Component\HttpFoundation\Response
     * @throws \Doctrine\ORM\OptimisticLockException
     * @throws \Spipu\Html2Pdf\Exception\Html2PdfException
     */
    public function confirmationAction(Request $request)
    {
        $tools = $this->get('admin.admin_bundle.tools');
        $em = $this->getDoctrine()->getManager();

        $cart = $this->get('admin.admin_bundle.tools')->getUserCart();

        /** @var User $user */
        $user = $this->getUser();

        $ref = $request->get('vads_trans_id');
        $ref = 'W' . $ref;

        /** @var Order $order */
        $order = $em->getRepository(Order::class)->findOneBy(['reference' => $ref]);


        if (!is_object($user) || !$user instanceof UserInterface) {
            return $this->redirectToRoute('front_fos_user_security_login');
        }


        if ($order == null) {
            $ref = $this->get('session')->get('transId');
            $ref = 'W' . $ref;

            /** @var Order $order */
            $order = $em->getRepository(Order::class)->findOneBy(['reference' => $ref]);


        }

        if ($order->getPaymentMethod() == "cheque" || $order->getPaymentMethod() == 'virement') {

            $pathPdfFolder = $this->get('kernel')->getRootDir() . '/../web/pdf';

            if (!is_dir($pathPdfFolder)) {
                mkdir($pathPdfFolder, 0777);
            }

            if (!is_dir($pathPdfFolder . '/order')) {
                mkdir($pathPdfFolder . '/order', 0777);
            }

            $pdf = $this->get('ip_pdf.factory')->create();
            $pdf->setDefaultFont('Helvetica');
            $pdf->writeHTML($this->renderView('FrontFrontBundle:Pdf/Order:orderConfirmation.html.twig', [
                'order' => $order,
                'cart'=>$order->getCart()

            ]));

            $pdfName = md5(uniqid()) . '.pdf';

            $path = $this->container->getParameter('kernel.root_dir') . '/../web/pdf/order';

            $pdf->output($path . '/' . $pdfName, 'F');

            $order->setPdfName($pdfName);

            $promotionName = null;

            if ($cart->getPromotion()){
                $promotionName = $cart->getPromotion()->getName();
            }

            /**@var $cartElement CartElement **/
            foreach ($cart->getCartElements() as $cartElement){
                if ($cartElement->getPromotion()){
                    $promotionName = $cartElement->getPromotion()->getName();
                }
            }

            $order->setPromotionName($promotionName);
            $em->persist($order);

            if ($order->getPaymentMethod() == 'cheque') {
                $title = ['name' => 'cheque'];

            } else {
                $title = ['name' => 'virement'];

            }


            if ($this->getParameter('dev') == false) {
                $mails_contacts = ['milene@wismersas.fr', 'sophie@wismersas.fr', 'anne@wismersas.fr', 'contact@info-plus.fr', 'contact@huromfrance.com', $cart->getUser()->getEmail()];

                foreach ($mails_contacts as $mailcontact) {
                    $message = \Swift_Message::newInstance()
                        ->setSubject('Paiement en attente - ' . $tools->getSettingByName('COMPANY_NAME'))
                        ->setFrom('contact@huromfrance.com')
                        ->setTo($mailcontact)
                        ->setBody(
                            $this->renderView(
                                'FrontFrontBundle:Mail/Order:order.html.twig', [
                                    'order' => $order,
                                    'title' => $title,
                                    'cart'=>$order->getCart()

                                ]
                            ),
                            'text/html'
                        )
                        ->attach(\Swift_Attachment::fromPath('pdf/order/' . $order->getPdfName()));
                    if ($order->getPaymentMethod() == 'virement') {
                        $message->attach(\Swift_Attachment::fromPath('assets_front/RIB_WISMER.pdf'));

                    }

                    $this->get('mailer')->send($message);
                    $this->get('admin.order_bundle.order')->generateStatus($order, $cart, OrderStatus::WAITING_FOR_PAYMENT);
                    $this->get('session')->remove('transId');
                }
            } else {
                $message = \Swift_Message::newInstance()
                    ->setSubject('Paiement en attente - ' . $tools->getSettingByName('COMPANY_NAME'))
                    ->setFrom('contact@whuromfrance.com')
                    ->setTo('yoann88110@gmail.com')
                    ->setBody(
                        $this->renderView(
                            'FrontFrontBundle:Mail/Order:order.html.twig', [
                                'order' => $order,
                                'title' => $title,
                                'cart'=>$order->getCart()

                            ]
                        ),
                        'text/html'
                    )
                    ->attach(\Swift_Attachment::fromPath('pdf/order/' . $order->getPdfName()));
                if ($order->getPaymentMethod() == 'virement') {
                    $message->attach(\Swift_Attachment::fromPath('assets_front/RIB_WISMER.pdf'));

                }

                $this->get('mailer')->send($message);
                $this->get('admin.order_bundle.order')->generateStatus($order, $cart, OrderStatus::WAITING_FOR_PAYMENT);
                $this->get('session')->remove('transId');
            }


            $cartElements = $cart->getCartElements();

            /** @var CartElement $cartElement */
            foreach ($cartElements as $cartElement) {
                $cartElement->setDeletedAt(new \DateTime('now'));

                $em->persist($cartElement);
            }


            $order->setCart(null);
            $em->persist($order);
            $em->flush();

            return $this->render('@FrontOrder/Order/confirmation.html.twig');
        } else {

            switch ($order->getResultBanque()) {
                case 'REFUSED':
//                    $order->setCart(null);
                    $em->persist($order);
                    $em->flush();
                    return $this->redirectToRoute('front_front_home_index');

                    break;

                case 'CANCELLED':
                    $order->setCart(null);
                    $em->persist($order);
                    $em->flush();
                    return $this->redirectToRoute('front_front_home_index');
                    break;

                case  'ABANDONED':
                    $order->setCart(null);
                    $em->persist($order);
                    $em->flush();
                    return $this->redirectToRoute('front_front_home_index');
                    break;

                case 'AUTHORISED':
                    return $this->render('@FrontOrder/Order/confirmation.html.twig');
                    break;


            }

        }


        return $this->redirectToRoute('front_front_home_index');
    }


    private function extreactNumberOrder($order)
    {
        $em = $this->getDoctrine()->getManager();

        $patternRegex = '!\d+!';
        $reg = preg_match_all($patternRegex, $order->getReference(), $result);


        $verifyRef = $em->getRepository(Order::class)->findBy(['reference'=>'W'.current($result[0])]);


        if (count($verifyRef ) >1){

            return 0;
        }

        return current($result[0]);
    }

    public function checkPaymentAction(Request $request)
    {
        $message = \Swift_Message::newInstance()
            ->setSubject('test')
            ->setFrom($this->getParameter('entreprise_mail'))
            ->setTo('yoann@info-plus.fr')
            ->setBody(
                'test',
                'text/html'
            );
        $this->get('mailer')->send($message);

        $tools = $this->get('admin.admin_bundle.tools');

        $em = $this->getDoctrine()->getManager();

        $resultBanque = $request->get('vads_trans_status');

        $ref = $request->get('vads_trans_id');
        $ref = 'W' . $ref;


        /** @var Order $order */
        $order = $em->getRepository(Order::class)->findOneBy(['reference' => $ref]);
        $order->setResultBanque($resultBanque);
        $cart = $order->getCart();
        $em->persist($order);
        $em->flush();


        switch ($resultBanque) {
            case 'REFUSED':

                $this->get('admin.order_bundle.order')->generateStatus($order, $cart, OrderStatus::REFUSED_PAYMENT);
                $this->get('admin.order_bundle.mails_status')->sendMail($order, OrderStatus::REFUSED_PAYMENT, 'Paiement refusé', $cart->getUser()->getEmail());

                $order->setCart(null);
                $em->persist($order);

                $em->flush();

                break;

            case 'CANCELLED':
                $this->get('admin.order_bundle.order')->generateStatus($order, $cart, OrderStatus::CANCEL);
                $this->get('admin.order_bundle.mails_status')->sendMail($order, OrderStatus::CANCEL, 'Paiement annulé', $cart->getUser()->getEmail());
                $order->setCart(null);
                $em->persist($order);
                $em->flush();
                return $this->redirectToRoute('front_front_home_index');
                break;

            case  'ABANDONED':
                $this->get('admin.order_bundle.order')->generateStatus($order, $cart, OrderStatus::ABANDONED);
                $this->get('admin.order_bundle.mails_status')->sendMail($order, OrderStatus::ABANDONED, 'Payment abandonné', $cart->getUser()->getEmail());
                $order->setCart(null);
                $em->persist($order);
                $em->flush();

                return $this->redirectToRoute('front_front_home_index');
                break;

            case 'AUTHORISED':
                if (!is_null($order)) {


                    $pathPdfFolder = $this->get('kernel')->getRootDir() . '/../web/pdf';

                    if (!is_dir($pathPdfFolder)) {
                        mkdir($pathPdfFolder, 0777);
                    }

                    if (!is_dir($pathPdfFolder . '/order')) {
                        mkdir($pathPdfFolder . '/order', 0777);
                    }

                    $pdf = $this->get('ip_pdf.factory')->create();
                    $pdf->setDefaultFont('Helvetica');
                    $pdf->writeHTML($this->renderView('FrontFrontBundle:Pdf/Order:orderConfirmation.html.twig', [
                        'order' => $order,

                    ]));

                    $pdfName = md5(uniqid()) . '.pdf';

                    $path = $this->container->getParameter('kernel.root_dir') . '/../web/pdf/order';

                    $pdf->output($path . '/' . $pdfName, 'F');

                    $order->setPdfName($pdfName);
                    $em->persist($order);


                    if ($this->getParameter('dev') == false) {
                        $mails_contacts = ['milene@wismersas.fr', 'sophie@wismersas.fr', 'anne@wismersas.fr', 'contact@huromfrance.com', $order->getUser()->getEmail(), 'contact@info-plus.fr'];

                        foreach ($mails_contacts as $mails_contact) {
                            $message = \Swift_Message::newInstance()
                                ->setSubject('Confirmation de commande - ' . $tools->getSettingByName('COMPANY_NAME'))
                                ->setFrom('contact@huromfrance.com')
                                ->setTo($mails_contact)
                                ->setBody(
                                    $this->renderView(
                                        'FrontFrontBundle:Mail/Order:order.html.twig', [
                                            'order' => $order,
                                            'cart'=>$order->getCart()

                                        ]
                                    ),
                                    'text/html'
                                )
                                ->attach(\Swift_Attachment::fromPath('pdf/order/' . $order->getPdfName()));

                            $this->get('mailer')->send($message);
                        }
                    } else {
                        $mails_contacts = ['yoann88110@gmail.com', $order->getUser()->getEmail()];

                        foreach ($mails_contacts as $mails_contact) {
                            $message = \Swift_Message::newInstance()
                                ->setSubject('Confirmation de commande - ' . $tools->getSettingByName('COMPANY_NAME'))
                                ->setFrom('contact@huromfrance.com')
                                ->setTo($mails_contact)
                                ->setBody(
                                    $this->renderView(
                                        'FrontFrontBundle:Mail/Order:order.html.twig', [
                                            'order' => $order,
                                            'cart'=>$order->getCart()

                                        ]
                                    ),
                                    'text/html'
                                )
                                ->attach(\Swift_Attachment::fromPath('pdf/order/' . $order->getPdfName()));

                            $this->get('mailer')->send($message);
                        }
                    }


                    $this->get('admin.order_bundle.order')->generateStatus($order, $cart, OrderStatus::PAID);


                    $cartElements = $em->getRepository(CartElement::class)->createQueryBuilder('c')
                        ->where('c.cart = :cart')
                        ->setParameter('cart', $cart)
                        ->andWhere('c.deletedAt  IS NULL ')
                        ->getQuery()
                        ->getResult();

                    if ($cartElements) {
                        /** @var CartElement $cartElement */
                        foreach ($cartElements as $cartElement) {
                            $cart->removeCartElement($cartElement);
                            $cart->setPromotion(null);
                            $cartElement->setDeletedAt(new  \DateTime('now'));
                            $em->persist($cartElement);
                            $em->persist($cart);
                            $em->flush();
                        }
                    }


                    $order->setCart(null);
                    $em->persist($order);
                    $em->flush();
                }
        }


        return $this->redirectToRoute('front_front_home_index');
    }


    public function ErrorAction(Request $request)
    {

        $em = $this->getDoctrine()->getManager();
        $tools = $this->get('admin.admin_bundle.tools');
        $user = $this->getUser();
        $cart = $tools->getUserCart();

        $order = $cart->getOrder();

        $order->setCart(null);
        $em->persist($order);
        $em->flush();

        return $this->redirectToRoute('front_cart_index');


    }
}

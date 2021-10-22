<?php

namespace UserBundle\Controller;

use FOS\UserBundle\Model\UserInterface;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;
use UserBundle\Entity\Address;
use UserBundle\Entity\User;
use UserBundle\Form\AddressAddType;
use UserBundle\Form\AddressEditType;

class OrderController extends Controller
{
    /**
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function indexAction()
    {
        /** @var User $user */
        $user = $this->getUser();

        if (!is_object($user) || !$user instanceof UserInterface) {
            throw new AccessDeniedException($this->get('translator')->trans("This user does not have access to this section."));
        }

        return $this->render('@User/Profile/Order/index.html.twig', [
            'user' => $user,
        ]);
    }

    /**
     * @param Request $request
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function addAction(Request $request)
    {
        $user = $this->getUser();
        if (!is_object($user) || !$user instanceof UserInterface) {
            throw new AccessDeniedException($this->get('translator')->trans("This user does not have access to this section."));
        }

        $em = $this->getDoctrine()->getManager();

        /** @var Address $address */
        $address = new Address();

        $form = $this->createForm(AddressAddType::class, $address);
        $form->handleRequest($request);

        if ($form->isSubmitted() and $form->isValid()) {
            $address->setUser($user);

            $em->persist($address);
            $em->flush();

            return $this->redirectToRoute('front_user_address_index');
        }

        return $this->render('@User/Profile/Address/add.html.twig', [
            'form' => $form->createView(),
        ]);
    }

    /**
     * @param Address $address
     * @param Request $request
     * @return \Symfony\Component\HttpFoundation\RedirectResponse|\Symfony\Component\HttpFoundation\Response
     */
    public function editAction(Address $address, Request $request)
    {
        /** @var User $user */
        $user = $this->getUser();
        if (!is_object($user) || !$user instanceof UserInterface) {
            throw new AccessDeniedException($this->get('translator')->trans("This user does not have access to this section."));
        }

        $em = $this->getDoctrine()->getManager();

        $form = $this->createForm(AddressEditType::class, $address);
        $form->handleRequest($request);

        if ($form->isSubmitted() and $form->isValid()) {
            $em->persist($address);
            $em->flush();

            return $this->redirectToRoute('front_user_address_index');
        }

        return $this->render('@User/Profile/Address/edit.html.twig', [
            'address' => $address,
            'form' => $form->createView(),
        ]);
    }

    /**
     * @param Address $address
     * @param Request $request
     * @return JsonResponse
     */
    public function deleteAction(Address $address, Request $request)
    {
        /** @var User $user */
        $user = $this->getUser();
        if (!is_object($user) || !$user instanceof UserInterface) {
            throw new AccessDeniedException($this->get('translator')->trans("This user does not have access to this section."));
        }

        $em = $this->getDoctrine()->getManager();

        if ($address->getDefaultBilling() and $address->getDefaultDelivery()) {

            if (count($user->getAddress()) > 1) {

                $newAddress = null;

                /** @var Address $value */
                foreach ($user->getAddress() as $value) {
                    if ($value->getId() != $address->getId()) {
                        $newAddress = $value;
                        break;
                    }
                }

                $newAddress->setDefaultBilling(true);
                $newAddress->setDefaultDelivery(true);
                $em->persist($newAddress);

                $address->setDefaultDelivery(false);
                $address->setDefaultBilling(false);
                $em->persist($address);
                $em->flush();

                $em->remove($address);
                $em->flush();
            } else {
                $r = [
                    'error' => [$this->get('translator')->trans("Vous ne pouvez pas supprimer votre dernière adresse")],
                ];

                return new JsonResponse($r);
            }

        } elseif ($address->getDefaultBilling()) {
            /** @var Address $defaultDelivery */
            $defaultDelivery = $user->getDefaultDeliveryAddress();

            $defaultDelivery->setDefaultBilling(true);
            $em->persist($defaultDelivery);

            $address->setDefaultBilling(false);
            $em->persist($address);
            $em->flush();

            $em->remove($address);
            $em->flush();
        } elseif ($address->getDefaultDelivery()) {
            /** @var Address $defaultBilling */
            $defaultBilling = $user->getDefaultBillingAddress();

            $defaultBilling->setDefaultDelivery(true);
            $em->persist($defaultBilling);

            $address->setDefaultDelivery(false);
            $em->persist($address);
            $em->flush();

            $em->remove($address);
            $em->flush();
        }

        $r = [
            'success' => [$this->get('translator')->trans("Adresse supprimée avec succès")],
        ];

        return new JsonResponse($r);
    }

    /**
     * @param Address $address
     * @param Request $request
     * @return JsonResponse
     */
    public function editDefaultAction(Address $address, Request $request)
    {
        /** @var User $user */
        $user = $this->getUser();
        if (!is_object($user) || !$user instanceof UserInterface) {
            throw new AccessDeniedException($this->get('translator')->trans("This user does not have access to this section."));
        }

        $em = $this->getDoctrine()->getManager();

        $type = $request->get('type');
        $newAddress = [];

        if ($type == 'billing_address') {
            /** @var Address $currentAddress */
            $currentAddress = $user->getDefaultBillingAddress();
            $currentAddress->setDefaultBilling(false);
            $em->persist($currentAddress);

            $address->setDefaultBilling(true);
            $em->persist($address);

            $em->flush();

            $newAddress = $user->getDefaultBillingAddress();
        } elseif ($type == 'delivery_address') {
            /** @var Address $currentAddress */
            $currentAddress = $user->getDefaultDeliveryAddress();
            $currentAddress->setDefaultDelivery(false);
            $em->persist($currentAddress);

            $address->setDefaultDelivery(true);
            $em->persist($address);

            $em->flush();

            $newAddress = $user->getDefaultDeliveryAddress();
        }

        if (!is_null($newAddress)) {
            $newAddress = [
                'id' => $newAddress->getId(),
                'civility' => $newAddress->getCivility(),
                'firstname' => $newAddress->getFirstname(),
                'lastname' => $newAddress->getLastname(),
                'address' => $newAddress->getAddress(),
                'postalCode' => $newAddress->getPostalCode(),
                'city' => $newAddress->getCity(),
                'country' => $newAddress->getCountry()->getName(),
            ];
        }

        $r = [
            'success' => $this->get('translator')->trans("Adresse pas défaut modifiée avec succès"),
            'address' => $newAddress,
        ];

        return new JsonResponse($r);
    }
}

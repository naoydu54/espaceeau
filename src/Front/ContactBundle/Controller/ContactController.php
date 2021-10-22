<?php

namespace Front\ContactBundle\Controller;

use Admin\MenuBundle\Entity\Menu;
use Admin\PageBundle\Entity\Page;
use Admin\SliderBundle\Entity\Slider;
use Front\ContactBundle\Entity\Contact;
use Front\ContactBundle\Form\ContactType;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;

class ContactController extends Controller
{
    /**
     * @param Request $request
     * @return \Symfony\Component\HttpFoundation\RedirectResponse|\Symfony\Component\HttpFoundation\Response
     */
    public function indexAction(Request $request)
    {
        $em = $this->getDoctrine()->getManager();

        /** @var Menu $menu */
        $menu = $em->getRepository(Menu::class)->findOneByRoute($request->attributes->get('_route'));

//        $pageEntity = $em->getRepository(Page::class)->findOneBy(['menu' => $menu]);
////        dump($pageEntity);exit();
//        $slider = $pageEntity->getSlider();
        $slider = $em->getRepository(Slider::class)->findOneBy(['name'=>'Contact']);

        $contact = new Contact();
        $form = $this->createForm(ContactType::class, $contact);

        $form->handleRequest($request);


        if ($form->isSubmitted() and $form->isValid()) {
            $em->persist($contact);

            if ($this->getParameter('dev') == true) {
                $mailSite = $this->getParameter('ip_mail');
            } else {
                $mailSite = $this->getParameter('entreprise_mail');
            }

            $mails = [$mailSite, 'contact@conceptsiteweb.com'];
            foreach ($mails as $mail) {
                $message = \Swift_Message::newInstance()
                    ->setSubject('Nouvelle demande de contact - '.$this->getParameter('entreprise_mail'))
                    ->setFrom($contact->getEmail())
                    ->setTo($mail)
                    ->setBody(
                        $this->renderView(
                            'FrontContactBundle:Mail:contact.html.twig', [
                                'contact' => $contact,
                            ]
                        ),
                        'text/html'
                    );

                $this->get('mailer')->send($message);
            }


            $em->flush();

            $this->addFlash('success', 'Votre demande a bien été envoyée !');

            return $this->redirect($this->generateUrl('front_contact_index'));
        }

        return $this->render('FrontContactBundle:Contact:index.html.twig', [
            'menu' => $menu,
            'slider' => $slider,
            'form' => $form->createView(),
        ]);
    }

    /**
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function mailViewAction()
    {
        if ($this->getParameter('dev')) {
            $contact = new Contact();
            $contact->setNom('Nom');
            $contact->setEmail('test@test.com');
            $contact->setSujet('Sujet');
            $contact->setMessage('Message');

            return $this->render('FrontContactBundle:Mail:contact.html.twig', [
                'contact' => $contact,
            ]);
        }

        throw $this->createNotFoundException($this->get('translator')->trans("Cette page n'existe pas !"));
    }
}

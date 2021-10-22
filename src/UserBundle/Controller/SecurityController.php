<?php

namespace UserBundle\Controller;

use FOS\UserBundle\Controller\SecurityController as BaseController;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\Session\Session;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Core\Security;
class SecurityController extends BaseController
{
    public function renderLogin(array $data)
    {
        $requestAttributs = $this->container->get('request_stack')->getCurrentRequest()->attributes;
        if ($requestAttributs->get('_route') == 'admin_fos_user_security_login') {
            $template = '@User/Admin/Security/login.html.twig';
        } else {
            $template = '@User/Security/login.html.twig';

        }


        return $this->render($template, $data);
    }



    /**
     * @param Request $request
     *
     * @return Response
     */
    public function loginAction(Request $request)
    {
        /** @var $session Session */
        $session = $request->getSession();

        $authErrorKey = Security::AUTHENTICATION_ERROR;
        $lastUsernameKey = Security::LAST_USERNAME;

        $host= $request->headers->get('host');
        $referer =$request->headers->get('referer');
        $test = str_replace($host, '', $referer);
        $requestScheme = $request->server->get('REQUEST_SCHEME');
        $test = str_replace($requestScheme, '', $test);
        $requestUri = $request->getRequestUri();
        $test = str_replace($requestUri, '', $test);
        $baseUrl = $request->getBaseUrl();
        $test = str_replace($baseUrl, '', $test);
        $other = (':///');
        $referer = $test = str_replace($other, '', $test);




        if (strpos($referer, 'product') !== false) {

        }else{
            $referer = null;
        }




        // get the error if any (works with forward and redirect -- see below)
        if ($request->attributes->has($authErrorKey)) {
            $error = $request->attributes->get($authErrorKey);

        } elseif (null !== $session && $session->has($authErrorKey)) {
            $error = $session->get($authErrorKey);
            $session->remove($authErrorKey);
        } else {
            $error = null;
        }

        if (!$error instanceof AuthenticationException) {
            $error = null; // The value does not come from the security component.
        }

        // last username entered by the user
        $lastUsername = (null === $session) ? '' : $session->get($lastUsernameKey);

        $csrfToken = $this->has('security.csrf.token_manager')
            ? $this->get('security.csrf.token_manager')->getToken('authenticate')->getValue()
            : null;


        return $this->renderLogin(array(
            'last_username' => $lastUsername,
            'error' => $error,
            'csrf_token' => $csrfToken,
            'referer'=>$referer
        ));
    }

}

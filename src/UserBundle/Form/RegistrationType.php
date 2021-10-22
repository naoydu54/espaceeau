<?php

namespace UserBundle\Form;

use FOS\UserBundle\Form\Type\RegistrationFormType;
use FOS\UserBundle\Util\LegacyFormHelper;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\ChoiceType;
use Symfony\Component\Form\Extension\Core\Type\CollectionType;
use Symfony\Component\Form\Extension\Core\Type\SubmitType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\FormBuilderInterface;

class RegistrationType extends AbstractType
{
    /**
     * {@inheritdoc}
     */
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder
            ->add('acceptMailling', ChoiceType::class,[
                'choices'=>[
                    'Oui'=>true,
                    'Non'=>false
                ],
                'label'=>'Inscription à la NewsLetter'
            ])
            ->remove('email')
            ->remove('username')
            ->remove('plainPassword')
            ->add('civility', ChoiceType::class, [
                'choices' => [
                    'Mme' => 'Mme',
                    'M' => 'M',
                ],
                'expanded' => true,
                'multiple' => false,
                'data' => 'Mme',
            ])
            ->add('lastname', TextType::class)
            ->add('firstname', TextType::class)
            ->add('email', LegacyFormHelper::getType('Symfony\Component\Form\Extension\Core\Type\EmailType'), array('label' => 'form.email', 'translation_domain' => 'FOSUserBundle'))
            ->add('plainPassword', LegacyFormHelper::getType('Symfony\Component\Form\Extension\Core\Type\RepeatedType'), array(
                'type' => LegacyFormHelper::getType('Symfony\Component\Form\Extension\Core\Type\PasswordType'),
                'options' => array('translation_domain' => 'FOSUserBundle'),
                'first_options' => array('label' => 'form.password'),
                'second_options' => array('label' => 'form.password_confirmation'),
                'invalid_message' => 'fos_user.password.mismatch',
            ))
//            ->add('homePhone', TextType::class, [
//                'required' => false,
//            ])
            ->add('cellPhone', TextType::class, [
                'required' => true,
            ])

            /*->add('address', AddressType::class, [
                'data_class' => null,
                'label' => false,
            ])*/
            ->add('address', CollectionType::class, [
                'entry_type' => AddressType::class,
                'allow_add' => false,
                'allow_delete' => false,
            ])
            ->add('add', SubmitType::class, [
                'icon' => 'fa-plus',
                'attr' => [
                    'class' => 'btn-primary',
                ],
                'label' => 'button.addAccount',
            ]);
    }

    public function getParent()
    {
        return RegistrationFormType::class;
    }

    public function getBlockPrefix()
    {
        return 'app_user_registration';
    }
}

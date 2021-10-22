<?php

namespace UserBundle\Form;

use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\ChoiceType;
use Symfony\Component\Form\Extension\Core\Type\SubmitType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\FormBuilderInterface;

class AddressAddType extends AbstractType
{
    /**
     * {@inheritdoc}
     */
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder
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
            ->add('add', SubmitType::class, [
                'icon' => 'fa-plus',
                'attr' => [
                    'class' => 'btn-primary',
                ],
            ]);
    }

    public function getParent()
    {
        return AddressType::class;
    }
}

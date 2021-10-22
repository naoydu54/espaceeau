<?php

namespace Front\FrontBundle\Form;


use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\SubmitType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\FormBuilderInterface;

class SearchType extends AbstractType
{
    /**
     * {@inheritdoc}
     */
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder
            ->add('search', \Symfony\Component\Form\Extension\Core\Type\SearchType::class, [

            ])
        ->add('submit', SubmitType::class, [
            'attr'=>[
                'class'=> 'btn btn-primary'
            ],
        ]);

    }



}

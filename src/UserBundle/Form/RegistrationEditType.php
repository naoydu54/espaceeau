<?php

namespace UserBundle\Form;

use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\ChoiceType;
use Symfony\Component\Form\Extension\Core\Type\SubmitType;
use Symfony\Component\Form\FormBuilderInterface;

class RegistrationEditType extends AbstractType
{
    /**
     * {@inheritdoc}
     */
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder
            ->remove('add')
            ->remove('address')
            ->remove('plainPassword')
            ->remove('civility')
            ->add('civility', ChoiceType::class, [
                'choices' => [
                    'Mme' => 'Mme',
                    'M' => 'M',
                ],
                'expanded' => true,
                'multiple' => false,
            ])

            ->add('acceptMailling', ChoiceType::class,[
                'choices'=>[
                    'Oui'=>true,
                    'Non'=>false
                ],
                'label'=>'Inscript à la NewsLetter'
            ])
            ->add('edit', SubmitType::class, [
                'icon' => 'fa-pencil',
                'attr' => [
                    'class' => 'btn-primary',
                ],
            ]);
    }

    public function getParent()
    {
        return RegistrationType::class;
    }
}

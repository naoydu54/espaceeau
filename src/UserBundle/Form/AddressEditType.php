<?php

namespace UserBundle\Form;

use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\SubmitType;
use Symfony\Component\Form\FormBuilderInterface;

class AddressEditType extends AbstractType
{
    /**
     * {@inheritdoc}
     */
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder
            ->remove('add')
            ->add('edit', SubmitType::class, [
                'icon' => 'fa-pencil',
                'attr' => [
                    'class' => 'btn-primary',
                ],
            ]);
    }

    public function getParent()
    {
        return AddressAddType::class;
    }
}

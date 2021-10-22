<?php

namespace UserBundle\Entity;

use Doctrine\Common\Collections\ArrayCollection;
use FOS\UserBundle\Model\Group as BaseGroup;
use Doctrine\ORM\Mapping as ORM;

/**
 * @ORM\Entity
 * @ORM\Table(name="fos_group")
 */
class Group extends BaseGroup
{
    /**
     * @ORM\Id
     * @ORM\Column(type="integer")
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    protected $id;

    /**
     * @ORM\ManyToMany(targetEntity="Admin\AdminBundle\Entity\MenuBack", mappedBy="groups")
     */
    private $menuBacks;

    public function __construct()
    {
        $this->menuBacks = new ArrayCollection();
    }

    /**
     * Add menuBack
     *
     * @param \Admin\AdminBundle\Entity\MenuBack $menuBack
     *
     * @return Group
     */
    public function addMenuBack(\Admin\AdminBundle\Entity\MenuBack $menuBack)
    {
        $this->menuBacks[] = $menuBack;

        return $this;
    }

    /**
     * Remove menuBack
     *
     * @param \Admin\AdminBundle\Entity\MenuBack $menuBack
     */
    public function removeMenuBack(\Admin\AdminBundle\Entity\MenuBack $menuBack)
    {
        $this->menuBacks->removeElement($menuBack);
    }

    /**
     * Get menuBacks
     *
     * @return \Doctrine\Common\Collections\Collection
     */
    public function getMenuBacks()
    {
        return $this->menuBacks;
    }
}

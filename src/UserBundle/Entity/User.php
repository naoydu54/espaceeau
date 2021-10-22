<?php
// src/UserBundle/Entity/User.php

namespace UserBundle\Entity;

use Admin\OrderBundle\Entity\Order;
use Admin\OrderBundle\Entity\OrderStatus;
use Admin\OrderBundle\Entity\OrderStatusHistory;
use Doctrine\Common\Collections\ArrayCollection;
use FOS\UserBundle\Model\GroupInterface;
use FOS\UserBundle\Model\User as BaseUser;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * @ORM\Entity
 * @ORM\Table(name="users")
 */
class User extends BaseUser
{
    /**
     * @ORM\Id
     * @ORM\Column(type="integer")
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    protected $id;

    /**
     * @var string
     *
     * @ORM\Column(name="civility", type="string", length=255)
     */
    protected $civility;

    /**
     * @var string
     *
     * @Assert\NotBlank(message="user.lastname.notblank")
     *
     * @ORM\Column(name="lastname", type="string", length=255)
     */
    protected $lastname;

    /**
     * @var string
     *
     * @Assert\NotBlank(message="user.firstname.notblank")
     *
     * @ORM\Column(name="firstname", type="string", length=255)
     */
    protected $firstname;

//    /**
//     * @var string
//     *
//     * @ORM\Column(name="home_phone", type="string", nullable=false)
//     *
//     * @Assert\Type(
//     *     type="numeric",
//     *     message="user.homephone.integer"
//     * )
//     */
//    protected $homePhone;

    /**
     * @var string
     *
     * @ORM\Column(name="cell_phone", type="string", nullable=false)
     *
     * @Assert\Type(
     *     type="numeric",
     *     message="user.cellephone.integer"
     * )
     */
    protected $cellPhone;

    /**
     * @ORM\OneToMany(targetEntity="UserBundle\Entity\Address", mappedBy="user", cascade={"persist"})
     */
    private $address;

    /**
     * @ORM\OneToMany(targetEntity="Admin\ProductBundle\Entity\Product", mappedBy="user")
     */
    private $products;

    /**
     * @ORM\OneToMany(targetEntity="Admin\ProductBundle\Entity\Brand", mappedBy="user")
     */
    private $brands;

    /**
     * @ORM\OneToMany(targetEntity="Admin\ActualityBundle\Entity\Actuality", mappedBy="user")
     */
    private $actualitys;

    /**
     * @ORM\OneToMany(targetEntity="Admin\PageBundle\Entity\Page", mappedBy="user")
     */
    private $pages;

    /**
     * @ORM\OneToMany(targetEntity="Admin\SliderBundle\Entity\Slider", mappedBy="user")
     */
    private $sliders;

    /**
     * @ORM\OneToMany(targetEntity="Admin\GalleryBundle\Entity\Gallery", mappedBy="user")
     */
    private $gallery;

    /**
     * @ORM\OneToOne(targetEntity="Admin\ProductBundle\Entity\Cart", mappedBy="user")
     */
    private $cart;

    /**
     * @ORM\OneToMany(targetEntity="Admin\ProductBundle\Entity\Attribut", mappedBy="user")
     */
    private $attributs;

    /**
     * @ORM\OneToMany(targetEntity="Admin\ProductBundle\Entity\AttributValue", mappedBy="user")
     */
    private $attributValues;

    /**
     * @ORM\OneToMany(targetEntity="Admin\OrderBundle\Entity\Order", mappedBy="user")
     * @ORM\OrderBy({"dateUpdate" = "DESC"})
     */
    private $orders;

    /**
     * @ORM\OneToMany(targetEntity="Admin\CalendarBundle\Entity\Calendar", mappedBy="user")
     */
    private $calendars;

    /**
     * @ORM\OneToMany(targetEntity="Admin\CalendarBundle\Entity\Event", mappedBy="user")
     */
    private $events;

    /**
     * @ORM\ManyToMany(targetEntity="UserBundle\Entity\Group")
     * @ORM\JoinTable(name="users_groups",
     *      joinColumns={@ORM\JoinColumn(name="user_id", referencedColumnName="id")},
     *      inverseJoinColumns={@ORM\JoinColumn(name="group_id", referencedColumnName="id")}
     * )
     */
    protected $groups;

    /**
     * @ORM\OneToMany(targetEntity="Admin\PromotionBundle\Entity\Promotion", mappedBy="user")
     */
    private $promotions;

    /**
     * @ORM\OneToMany(targetEntity="Admin\PromotionBundle\Entity\PromotionUser", mappedBy="user")
     */
    private $promotionUsers;


    /**
     * Many Groups have Many Users.
     * @ORM\ManyToMany(targetEntity="Admin\ProductBundle\Entity\PreventAvailableProduct", mappedBy="users")
     */
    private $preventAvailableProducts;


    /**
     * @var string
     *
     * @ORM\Column(name="accept_mailling", type="boolean", nullable=true)
     */
    private $acceptMailling;



    public function __construct()
    {
        parent::__construct();

        $this->address = new ArrayCollection();
        $this->actualitys = new ArrayCollection();
        $this->products = new ArrayCollection();
        $this->brands = new ArrayCollection();
        $this->pages = new ArrayCollection();
        $this->sliders = new ArrayCollection();
        $this->groups = new ArrayCollection();
        $this->gallery = new ArrayCollection();
        $this->attributs = new ArrayCollection();
        $this->attributValues = new ArrayCollection();
        $this->orders = new ArrayCollection();
        $this->calendars = new ArrayCollection();
        $this->events = new ArrayCollection();
        $this->promotions = new ArrayCollection();
        $this->promotionUsers = new ArrayCollection();
        $this->preventAvailableProducts = new ArrayCollection();
    }

//    /**
//     * @Assert\IsTrue(message="user.cellehomephone.required")
//     */
//    public function isThereOneFieldFilled()
//    {
//        return ($this->cellPhone);
//    }

    public function setEmail($email)
    {
        parent::setEmail($email);
        parent::setUsername($email);
    }

    /**
     * Add product
     *
     * @param \Admin\ProductBundle\Entity\Product $product
     *
     * @return User
     */
    public function addProduct(\Admin\ProductBundle\Entity\Product $product)
    {
        $this->products[] = $product;

        return $this;
    }

    /**
     * Remove product
     *
     * @param \Admin\ProductBundle\Entity\Product $product
     */
    public function removeProduct(\Admin\ProductBundle\Entity\Product $product)
    {
        $this->products->removeElement($product);
    }

    /**
     * Get products
     *
     * @return \Doctrine\Common\Collections\Collection
     */
    public function getProducts()
    {
        return $this->products;
    }

    /**
     * Add brand
     *
     * @param \Admin\ProductBundle\Entity\Brand $brand
     *
     * @return User
     */
    public function addBrand(\Admin\ProductBundle\Entity\Brand $brand)
    {
        $this->brands[] = $brand;

        return $this;
    }

    /**
     * Remove brand
     *
     * @param \Admin\ProductBundle\Entity\Brand $brand
     */
    public function removeBrand(\Admin\ProductBundle\Entity\Brand $brand)
    {
        $this->brands->removeElement($brand);
    }

    /**
     * Get brands
     *
     * @return \Doctrine\Common\Collections\Collection
     */
    public function getBrands()
    {
        return $this->brands;
    }

    /**
     * Add actuality
     *
     * @param \Admin\ActualityBundle\Entity\Actuality $actuality
     *
     * @return User
     */
    public function addActuality(\Admin\ActualityBundle\Entity\Actuality $actuality)
    {
        $this->actualitys[] = $actuality;

        return $this;
    }

    /**
     * Remove actuality
     *
     * @param \Admin\ActualityBundle\Entity\Actuality $actuality
     */
    public function removeActuality(\Admin\ActualityBundle\Entity\Actuality $actuality)
    {
        $this->actualitys->removeElement($actuality);
    }

    /**
     * Get actualitys
     *
     * @return \Doctrine\Common\Collections\Collection
     */
    public function getActualitys()
    {
        return $this->actualitys;
    }

    /**
     * Add page
     *
     * @param \Admin\PageBundle\Entity\Page $page
     *
     * @return User
     */
    public function addPage(\Admin\PageBundle\Entity\Page $page)
    {
        $this->pages[] = $page;

        return $this;
    }

    /**
     * Remove page
     *
     * @param \Admin\PageBundle\Entity\Page $page
     */
    public function removePage(\Admin\PageBundle\Entity\Page $page)
    {
        $this->pages->removeElement($page);
    }

    /**
     * Get pages
     *
     * @return \Doctrine\Common\Collections\Collection
     */
    public function getPages()
    {
        return $this->pages;
    }

    /**
     * Add slider
     *
     * @param \Admin\SliderBundle\Entity\Slider $slider
     *
     * @return User
     */
    public function addSlider(\Admin\SliderBundle\Entity\Slider $slider)
    {
        $this->sliders[] = $slider;

        return $this;
    }

    /**
     * Remove slider
     *
     * @param \Admin\SliderBundle\Entity\Slider $slider
     */
    public function removeSlider(\Admin\SliderBundle\Entity\Slider $slider)
    {
        $this->sliders->removeElement($slider);
    }

    /**
     * Get sliders
     *
     * @return \Doctrine\Common\Collections\Collection
     */
    public function getSliders()
    {
        return $this->sliders;
    }

    /**
     * @return ArrayCollection $groups
     */
    public function getGroups()
    {
        return $this->groups;
    }

    /**
     * @param GroupInterface $group
     * @return void
     */
    public function addGroup(GroupInterface $group)
    {
        if (!$this->groups->contains($group)) {
            $this->groups->add($group);
        }
    }

    /**
     * @param GroupInterface $group
     * @return void
     */
    public function removeGroup(GroupInterface $group)
    {
        if ($this->groups->contains($group)) {
            $this->groups->removeElement($group);
        }
    }

    /**
     * Set civility
     *
     * @param string $civility
     *
     * @return User
     */
    public function setCivility($civility)
    {
        $this->civility = $civility;

        return $this;
    }

    /**
     * Get civility
     *
     * @return string
     */
    public function getCivility()
    {
        return $this->civility;
    }

    /**
     * Set lastname
     *
     * @param string $lastname
     *
     * @return User
     */
    public function setLastname($lastname)
    {
        $this->lastname = $lastname;

        return $this;
    }

    /**
     * Get lastname
     *
     * @return string
     */
    public function getLastname()
    {
        return $this->lastname;
    }

    /**
     * Set firstname
     *
     * @param string $firstname
     *
     * @return User
     */
    public function setFirstname($firstname)
    {
        $this->firstname = $firstname;

        return $this;
    }

    /**
     * Get firstname
     *
     * @return string
     */
    public function getFirstname()
    {
        return $this->firstname;
    }

//    /**
//     * Set homePhone
//     *
//     * @param string $homePhone
//     *
//     * @return User
//     */
//    public function setHomePhone($homePhone)
//    {
//        $this->homePhone = $homePhone;
//
//        return $this;
//    }
//
//    /**
//     * Get homePhone
//     *
//     * @return string
//     */
//    public function getHomePhone()
//    {
//        return $this->homePhone;
//    }

    /**
     * Set cellPhone
     *
     * @param string $cellPhone
     *
     * @return User
     */
    public function setCellPhone($cellPhone)
    {
        $this->cellPhone = $cellPhone;

        return $this;
    }

    /**
     * Get cellPhone
     *
     * @return string
     */
    public function getCellPhone()
    {
        return $this->cellPhone;
    }

    /**
     * Add gallery
     *
     * @param \Admin\GalleryBundle\Entity\Gallery $gallery
     *
     * @return User
     */
    public function addGallery(\Admin\GalleryBundle\Entity\Gallery $gallery)
    {
        $this->gallery[] = $gallery;

        return $this;
    }

    /**
     * Remove gallery
     *
     * @param \Admin\GalleryBundle\Entity\Gallery $gallery
     */
    public function removeGallery(\Admin\GalleryBundle\Entity\Gallery $gallery)
    {
        $this->gallery->removeElement($gallery);
    }

    /**
     * Get gallery
     *
     * @return \Doctrine\Common\Collections\Collection
     */
    public function getGallery()
    {
        return $this->gallery;
    }

    /**
     * Add address
     *
     * @param \UserBundle\Entity\Address $address
     *
     * @return User
     */
    public function addAddress(\UserBundle\Entity\Address $address)
    {
        $this->address[] = $address;

        return $this;
    }

    /**
     * Remove address
     *
     * @param \UserBundle\Entity\Address $address
     */
    public function removeAddress(\UserBundle\Entity\Address $address)
    {
        $this->address->removeElement($address);
    }

    /**
     * Get address
     *
     * @return \Doctrine\Common\Collections\Collection
     */
    public function getAddress()
    {
        return $this->address;
    }

    /**
     * @return Address
     */
    public function getDefaultBillingAddress()
    {
        /** @var Address $address */
        foreach ($this->getAddress() as $address) {
            if ($address->isDefaultBilling()) {
                return $address;
            }
        }
    }

    /**
     * @return Address
     */
    public function getDefaultDeliveryAddress()
    {
        /** @var Address $address */
        foreach ($this->getAddress() as $address) {
            if ($address->isDefaultDelivery()) {
                return $address;
            }
        }
    }

    /**
     * Set cart
     *
     * @param \Admin\ProductBundle\Entity\Cart $cart
     *
     * @return User
     */
    public function setCart(\Admin\ProductBundle\Entity\Cart $cart = null)
    {
        $this->cart = $cart;

        return $this;
    }

    /**
     * Get cart
     *
     * @return \Admin\ProductBundle\Entity\Cart
     */
    public function getCart()
    {
        return $this->cart;
    }

    /**
     * Set attributs
     *
     * @param \Admin\ProductBundle\Entity\Attribut $attributs
     *
     * @return User
     */
    public function setAttributs(\Admin\ProductBundle\Entity\Attribut $attributs = null)
    {
        $this->attributs = $attributs;

        return $this;
    }

    /**
     * Get attributs
     *
     * @return \Admin\ProductBundle\Entity\Attribut
     */
    public function getAttributs()
    {
        return $this->attributs;
    }

    /**
     * Set attributValues
     *
     * @param \Admin\ProductBundle\Entity\AttributValue $attributValues
     *
     * @return User
     */
    public function setAttributValues(\Admin\ProductBundle\Entity\AttributValue $attributValues = null)
    {
        $this->attributValues = $attributValues;

        return $this;
    }

    /**
     * Get attributValues
     *
     * @return \Admin\ProductBundle\Entity\AttributValue
     */
    public function getAttributValues()
    {
        return $this->attributValues;
    }

    /**
     * Add attribut
     *
     * @param \Admin\ProductBundle\Entity\Attribut $attribut
     *
     * @return User
     */
    public function addAttribut(\Admin\ProductBundle\Entity\Attribut $attribut)
    {
        $this->attributs[] = $attribut;

        return $this;
    }

    /**
     * Remove attribut
     *
     * @param \Admin\ProductBundle\Entity\Attribut $attribut
     */
    public function removeAttribut(\Admin\ProductBundle\Entity\Attribut $attribut)
    {
        $this->attributs->removeElement($attribut);
    }

    /**
     * Add attributValue
     *
     * @param \Admin\ProductBundle\Entity\AttributValue $attributValue
     *
     * @return User
     */
    public function addAttributValue(\Admin\ProductBundle\Entity\AttributValue $attributValue)
    {
        $this->attributValues[] = $attributValue;

        return $this;
    }

    /**
     * Remove attributValue
     *
     * @param \Admin\ProductBundle\Entity\AttributValue $attributValue
     */
    public function removeAttributValue(\Admin\ProductBundle\Entity\AttributValue $attributValue)
    {
        $this->attributValues->removeElement($attributValue);
    }

    /**
     * Add order
     *
     * @param \Admin\OrderBundle\Entity\Order $order
     *
     * @return User
     */
    public function addOrder(\Admin\OrderBundle\Entity\Order $order)
    {
        $this->orders[] = $order;

        return $this;
    }

    /**
     * Remove order
     *
     * @param \Admin\OrderBundle\Entity\Order $order
     */
    public function removeOrder(\Admin\OrderBundle\Entity\Order $order)
    {
        $this->orders->removeElement($order);
    }

    /**
     * Get orders
     *
     * @return \Doctrine\Common\Collections\Collection
     */
    public function getOrders()
    {
        return $this->orders;
    }

    /**
     * @return Order[]
     */
    public function getValidOrders()
    {
        /** @var Order[] $datas */
        $datas = [];

        /** @var Order $order */
        foreach ($this->getOrders() as $order) {
            /** @var OrderStatusHistory $orderStatusHistory */
            foreach ($order->getOrderStatusHistorys() as $orderStatusHistory) {

                $isPushed = false;

                switch ($orderStatusHistory->getOrderStatus()->getId()) {
                    case OrderStatus::SHOPPING_CART_IN_PROCESS:
                        break;
                    case OrderStatus::ABANDONED:
                        break;
                    case OrderStatus::CANCEL:
                        $datas[] = $order;
                        $isPushed = true;
                        break;
                    case OrderStatus::WAITING_FOR_PAYMENT:
                        $datas[] = $order;

                        $isPushed = true;

                        break;
                    case OrderStatus::REFUSED_PAYMENT:
                        break;
                    case OrderStatus::PAID:
                        $datas[] = $order;
                        $isPushed = true;
                        break;
                    case OrderStatus::SHIPPED:
                        $datas[] = $order;
                        $isPushed = true;
                        break;
                }

                if ($isPushed) {
                    break;
                }
            }
        }

        return $datas;
    }

    /**
     * Add calendar
     *
     * @param \Admin\CalendarBundle\Entity\Calendar $calendar
     *
     * @return User
     */
    public function addCalendar(\Admin\CalendarBundle\Entity\Calendar $calendar)
    {
        $this->calendars[] = $calendar;

        return $this;
    }

    /**
     * Remove calendar
     *
     * @param \Admin\CalendarBundle\Entity\Calendar $calendar
     */
    public function removeCalendar(\Admin\CalendarBundle\Entity\Calendar $calendar)
    {
        $this->calendars->removeElement($calendar);
    }

    /**
     * Get calendars
     *
     * @return \Doctrine\Common\Collections\Collection
     */
    public function getCalendars()
    {
        return $this->calendars;
    }

    /**
     * Add event
     *
     * @param \Admin\CalendarBundle\Entity\Event $event
     *
     * @return User
     */
    public function addEvent(\Admin\CalendarBundle\Entity\Event $event)
    {
        $this->events[] = $event;

        return $this;
    }

    /**
     * Remove event
     *
     * @param \Admin\CalendarBundle\Entity\Event $event
     */
    public function removeEvent(\Admin\CalendarBundle\Entity\Event $event)
    {
        $this->events->removeElement($event);
    }

    /**
     * Get events
     *
     * @return \Doctrine\Common\Collections\Collection
     */
    public function getEvents()
    {
        return $this->events;
    }

    /**
     * Add promotion.
     *
     * @param \Admin\PromotionBundle\Entity\Promotion $promotion
     *
     * @return User
     */
    public function addPromotion(\Admin\PromotionBundle\Entity\Promotion $promotion)
    {
        $this->promotions[] = $promotion;

        return $this;
    }

    /**
     * Remove promotion.
     *
     * @param \Admin\PromotionBundle\Entity\Promotion $promotion
     *
     * @return boolean TRUE if this collection contained the specified element, FALSE otherwise.
     */
    public function removePromotion(\Admin\PromotionBundle\Entity\Promotion $promotion)
    {
        return $this->promotions->removeElement($promotion);
    }

    /**
     * Get promotions.
     *
     * @return \Doctrine\Common\Collections\Collection
     */
    public function getPromotions()
    {
        return $this->promotions;
    }

    /**
     * Add promotionUser.
     *
     * @param \Admin\PromotionBundle\Entity\PromotionUser $promotionUser
     *
     * @return User
     */
    public function addPromotionUser(\Admin\PromotionBundle\Entity\PromotionUser $promotionUser)
    {
        $this->promotionUsers[] = $promotionUser;

        return $this;
    }

    /**
     * Remove promotionUser.
     *
     * @param \Admin\PromotionBundle\Entity\PromotionUser $promotionUser
     *
     * @return boolean TRUE if this collection contained the specified element, FALSE otherwise.
     */
    public function removePromotionUser(\Admin\PromotionBundle\Entity\PromotionUser $promotionUser)
    {
        return $this->promotionUsers->removeElement($promotionUser);
    }

    /**
     * Get promotionUsers.
     *
     * @return \Doctrine\Common\Collections\Collection
     */
    public function getPromotionUsers()
    {
        return $this->promotionUsers;
    }

    /**
     * Add preventAvailableProduct.
     *
     * @param \Admin\ProductBundle\Entity\PreventAvailableProduct $preventAvailableProduct
     *
     * @return User
     */
    public function addPreventAvailableProduct(\Admin\ProductBundle\Entity\PreventAvailableProduct $preventAvailableProduct)
    {
        $this->preventAvailableProducts[] = $preventAvailableProduct;

        return $this;
    }

    /**
     * Remove preventAvailableProduct.
     *
     * @param \Admin\ProductBundle\Entity\PreventAvailableProduct $preventAvailableProduct
     *
     * @return boolean TRUE if this collection contained the specified element, FALSE otherwise.
     */
    public function removePreventAvailableProduct(\Admin\ProductBundle\Entity\PreventAvailableProduct $preventAvailableProduct)
    {
        return $this->preventAvailableProducts->removeElement($preventAvailableProduct);
    }

    /**
     * Get preventAvailableProducts.
     *
     * @return \Doctrine\Common\Collections\Collection
     */
    public function getPreventAvailableProducts()
    {
        return $this->preventAvailableProducts;
    }

    /**
     * @return string
     */
    public function getAcceptMailling()
    {
        return $this->acceptMailling;
    }

    /**
     * @param string $acceptMailling
     */
    public function setAcceptMailling($acceptMailling)
    {
        $this->acceptMailling = $acceptMailling;
    }
}

<?php

namespace UserBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;
use Gedmo\Mapping\Annotation as Gedmo;

/**
 * @ORM\Entity
 * @ORM\Table(name="address")
 * @Gedmo\SoftDeleteable(fieldName="deletedAt")
 */
class Address
{
    /**
     * @ORM\Id
     * @ORM\Column(type="integer")
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    private $id;

    /**
     * @var string
     *
     * @ORM\Column(name="civility", type="string", length=255)
     */
    private $civility;

    /**
     * @var string
     *
     * @Assert\NotBlank(message="user.lastname.notblank")
     *
     * @ORM\Column(name="lastname", type="string", length=255)
     */
    private $lastname;

    /**
     * @var string
     *
     * @Assert\NotBlank(message="user.firstname.notblank")
     *
     * @ORM\Column(name="firstname", type="string", length=255)
     */
    private $firstname;

    /**
     * @var string
     *
     * @Assert\NotBlank(message="address.addresse.notblank")
     *
     * @ORM\Column(name="address", type="string", length=255)
     */
    private $address;

    /**
     * @var string
     *
     * @ORM\Column(name="postal_code", type="string")
     *
     * @Assert\Length(
     *     min = 5,
     *     max = 5,
     *     minMessage = "address.postalcode.min",
     *     maxMessage = "addresse.postalcode.max"
     * )
     * @Assert\Regex(
     *     pattern     = "/^[0-9]{5}+$/i",
     *     htmlPattern = "^[0-9]{5}+$"
     * )

     */
    private $postalCode;

    /**
     * @var string
     *
     * @Assert\NotBlank(message="address.city.notblank")
     *
     * @ORM\Column(name="city", type="string", length=255)
     */
    private $city;

    /**
     * @var bool
     *
     * @ORM\Column(name="default_billing", type="boolean")
     */
    private $defaultBilling;

    /**
     * @var bool
     *
     * @ORM\Column(name="default_delivery", type="boolean")
     */
    private $defaultDelivery;

    /**
     * @ORM\ManyToOne(targetEntity="UserBundle\Entity\Country", inversedBy="address")
     * @ORM\JoinColumn(name="country_id", referencedColumnName="id")
     */
    private $country;

    /**
     * @ORM\ManyToOne(targetEntity="UserBundle\Entity\User", inversedBy="address")
     * @ORM\JoinColumn(name="user_id", referencedColumnName="id")
     */
    private $user;

    /**
     * @var \DateTime
     *
     * @ORM\Column(name="date_add", type="datetime")
     */
    private $dateAdd;

    /**
     * @var \DateTime
     *
     * @ORM\Column(name="deleted_at", type="datetime", nullable=true)
     */
    private $deletedAt;

    public function __construct()
    {
        $this->dateAdd = new \DateTime();
        $this->defaultBilling = false;
        $this->defaultDelivery = false;
    }

    /**
     * Get id
     *
     * @return integer
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * Set postalCode
     *
     * @param string $postalCode
     *
     * @return Address
     */
    public function setPostalCode($postalCode)
    {
        $this->postalCode = $postalCode;

        return $this;
    }

    /**
     * Get postalCode
     *
     * @return string
     */
    public function getPostalCode()
    {
        return $this->postalCode;
    }

    /**
     * Set city
     *
     * @param string $city
     *
     * @return Address
     */
    public function setCity($city)
    {
        $this->city = $city;

        return $this;
    }

    /**
     * Get city
     *
     * @return string
     */
    public function getCity()
    {
        return $this->city;
    }

    /**
     * Set country
     *
     * @param \UserBundle\Entity\Country $country
     *
     * @return Address
     */
    public function setCountry(\UserBundle\Entity\Country $country = null)
    {
        $this->country = $country;

        return $this;
    }

    /**
     * Get country
     *
     * @return \UserBundle\Entity\Country
     */
    public function getCountry()
    {
        return $this->country;
    }

    /**
     * Set user
     *
     * @param \UserBundle\Entity\User $user
     *
     * @return Address
     */
    public function setUser(\UserBundle\Entity\User $user = null)
    {
        $this->user = $user;

        return $this;
    }

    /**
     * Get user
     *
     * @return \UserBundle\Entity\User
     */
    public function getUser()
    {
        return $this->user;
    }

    /**
     * Set address
     *
     * @param string $address
     *
     * @return Address
     */
    public function setAddress($address)
    {
        $this->address = $address;

        return $this;
    }

    /**
     * Get address
     *
     * @return string
     */
    public function getAddress()
    {
        return $this->address;
    }

    /**
     * Set defaultBilling
     *
     * @param boolean $defaultBilling
     *
     * @return Address
     */
    public function setDefaultBilling($defaultBilling)
    {
        $this->defaultBilling = $defaultBilling;

        return $this;
    }

    /**
     * Is defaultBilling
     *
     * @return boolean
     */
    public function isDefaultBilling()
    {
        return $this->defaultBilling;
    }

    /**
     * Set defaultDelivery
     *
     * @param boolean $defaultDelivery
     *
     * @return Address
     */
    public function setDefaultDelivery($defaultDelivery)
    {
        $this->defaultDelivery = $defaultDelivery;

        return $this;
    }

    /**
     * Is defaultDelivery
     *
     * @return boolean
     */
    public function isDefaultDelivery()
    {
        return $this->defaultDelivery;
    }

    /**
     * Set civility
     *
     * @param string $civility
     *
     * @return Address
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
     * @return Address
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
     * @return Address
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

    /**
     * Get defaultBilling
     *
     * @return boolean
     */
    public function getDefaultBilling()
    {
        return $this->defaultBilling;
    }

    /**
     * Get defaultDelivery
     *
     * @return boolean
     */
    public function getDefaultDelivery()
    {
        return $this->defaultDelivery;
    }

    /**
     * Set dateAdd
     *
     * @param \DateTime $dateAdd
     *
     * @return Address
     */
    public function setDateAdd($dateAdd)
    {
        $this->dateAdd = $dateAdd;

        return $this;
    }

    /**
     * Get dateAdd
     *
     * @return \DateTime
     */
    public function getDateAdd()
    {
        return $this->dateAdd;
    }

    /**
     * Set deletedAt
     *
     * @param \DateTime $deletedAt
     *
     * @return Address
     */
    public function setDeletedAt($deletedAt)
    {
        $this->deletedAt = $deletedAt;

        return $this;
    }

    /**
     * Get deletedAt
     *
     * @return \DateTime
     */
    public function getDeletedAt()
    {
        return $this->deletedAt;
    }
}

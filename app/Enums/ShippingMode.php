<?php

namespace App\Enums;

enum ShippingMode: string
{
    case AdminSet = 'admin_set';
    case Pickup = 'pickup';
}

<?php

namespace App\Enums;

enum CheckoutLinkStatus: string
{
    case Active = 'active';
    case Revoked = 'revoked';
}

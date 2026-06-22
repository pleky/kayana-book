<?php

namespace App\Enums;

enum OrderEventType: string
{
    case Created = 'created';
    case OngkirSet = 'ongkir_set';
    case Repriced = 'repriced';
    case Paid = 'paid';
    case Shipped = 'shipped';
    case Received = 'received';
    case Completed = 'completed';
    case Cancelled = 'cancelled';
}

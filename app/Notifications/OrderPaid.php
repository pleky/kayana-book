<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrderPaid extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Order $order) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $fulfillment = $this->order->fulfillment === 'ship' ? 'dikirim' : 'diambil di toko';

        return (new MailMessage)
            ->subject("Pesanan #{$this->order->id} sudah dibayar — perlu diproses")
            ->line("Pesanan #{$this->order->id} atas nama {$this->order->customer_name} sudah lunas.")
            ->line("Pesanan ini akan {$fulfillment}.")
            ->action('Proses pesanan', route('admin.orders.show', $this->order));
    }
}

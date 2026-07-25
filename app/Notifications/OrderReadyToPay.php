<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrderReadyToPay extends Notification implements ShouldQueue
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
        $total = number_format($this->order->total, 0, ',', '.');

        return (new MailMessage)
            ->subject("Pesanan #{$this->order->id} siap dibayar")
            ->greeting("Halo {$this->order->customer_name},")
            ->line("Ongkir untuk pesanan #{$this->order->id} sudah dikonfirmasi.")
            ->line("Total yang harus dibayar: Rp{$total}.")
            ->action('Bayar sekarang', route('orders.show', $this->order))
            ->line('Terima kasih sudah berbelanja di Kayana Book.');
    }
}

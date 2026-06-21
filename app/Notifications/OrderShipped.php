<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrderShipped extends Notification implements ShouldQueue
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
        $mail = (new MailMessage)
            ->subject("Pesanan #{$this->order->id} sedang dikirim")
            ->greeting("Halo {$this->order->customer_name},")
            ->line("Pesanan #{$this->order->id} sudah dikirim.");

        if ($this->order->shipping_courier) {
            $mail->line('Kurir: '.mb_strtoupper((string) $this->order->shipping_courier).' '.(string) $this->order->shipping_service);
        }

        if ($this->order->shipping_tracking_number) {
            $mail->line("No. resi: {$this->order->shipping_tracking_number}");
        }

        return $mail
            ->action('Lihat pesanan', route('orders.show', $this->order))
            ->line('Setelah barang sampai, klik "Pesanan diterima" di halaman pesanan.');
    }
}

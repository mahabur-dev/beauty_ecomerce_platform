<?php

namespace App\Domain\Identity\Notifications;

use App\Domain\Identity\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

final class ResetPasswordNotification extends Notification
{
    use Queueable;

    public function __construct(private readonly string $token) {}

    /** @return list<string> */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        if (! $notifiable instanceof User) {
            throw new \LogicException('Password reset notifications require an identity user.');
        }

        $email = rawurlencode((string) $notifiable->getEmailForPasswordReset());
        $url = rtrim((string) config('identity.storefront_url'), '/')
            .'/reset-password?token='.rawurlencode($this->token).'&email='.$email;

        return (new MailMessage)
            ->subject('Reset your Beauty Commerce password')
            ->line('A password reset was requested for your account.')
            ->action('Reset password', $url)
            ->line('If you did not request this, no action is required.');
    }
}

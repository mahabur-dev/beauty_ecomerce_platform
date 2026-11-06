<?php

namespace App\Domain\Identity\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

final class StaffInvitationNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly string $token,
        private readonly string $roleName,
    ) {}

    /** @return list<string> */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $url = rtrim((string) config('identity.admin_frontend_url'), '/')
            .'/accept-invitation?token='.urlencode($this->token);

        return (new MailMessage)
            ->subject('Your Beauty Commerce admin invitation')
            ->line("You have been invited as {$this->roleName}.")
            ->action('Accept invitation', $url)
            ->line('This invitation is single-use and expires automatically.');
    }
}

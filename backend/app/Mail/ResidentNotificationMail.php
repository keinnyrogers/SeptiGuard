<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ResidentNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $title,
        public string $message,
        public string $alertsUrl,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: $this->title);
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.resident-notification',
            text: 'emails.resident-notification-text',
            with: [
                'title' => $this->title,
                'notificationMessage' => $this->message,
                'alertsUrl' => $this->alertsUrl,
            ],
        );
    }
}

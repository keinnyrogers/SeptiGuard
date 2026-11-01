<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light">
    <title>{{ $title }}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#172033;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
        {{ $title }} — open SeptiGuard to see the details.
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f1f5f9;">
        <tr>
            <td align="center" style="padding:32px 16px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;">
                    <tr>
                        <td style="padding:0 8px 18px;">
                            <span style="font-size:20px;font-weight:700;letter-spacing:-0.4px;color:#0f172a;">
                                <span style="color:#06b6c4;">●</span> SeptiGuard
                            </span>
                            <span style="display:block;padding-top:4px;font-size:12px;color:#64748b;">Resident Portal</span>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:0 8px;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#ffffff;border:1px solid #e2e8f0;border-radius:16px;">
                                <tr>
                                    <td style="padding:32px 28px 28px;">
                                        <span style="display:inline-block;padding:6px 10px;border-radius:999px;background-color:#ecfeff;color:#0e7490;font-size:11px;font-weight:700;letter-spacing:0.7px;text-transform:uppercase;">
                                            Portal notification
                                        </span>
                                        <h1 style="margin:18px 0 12px;font-size:24px;line-height:1.3;color:#0f172a;">
                                            {{ $title }}
                                        </h1>
                                        <p style="margin:0;font-size:16px;line-height:1.7;color:#475569;white-space:pre-line;">
                                            {{ $notificationMessage }}
                                        </p>
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:26px;">
                                            <tr>
                                                <td align="center" style="border-radius:8px;background-color:#06b6c4;">
                                                    <a href="{{ $alertsUrl }}" style="display:inline-block;padding:13px 20px;border:1px solid #06b6c4;border-radius:8px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">
                                                        View your alerts
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                        <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#64748b;">
                                            Sign in to your SeptiGuard account to review your alerts and tank updates.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:20px 12px 0;text-align:center;font-size:12px;line-height:1.6;color:#64748b;">
                            This is an automated notification from SeptiGuard.<br>
                            Broadway Hagdan Loob HOA
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>

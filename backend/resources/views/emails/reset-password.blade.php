<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Reset Password - SiPetualang</title>
</head>
<body>
    <h2>Halo {{ $user->nama }}!</h2>

    <p>Kami menerima permintaan untuk mereset password akun Anda.</p>

    <p>Klik link di bawah ini untuk mereset password:</p>

    <a href="{{ $resetLink }}">{{ $resetLink }}</a>

    <p>Link ini akan kadaluarsa dalam 60 menit.</p>

    <p>Jika Anda tidak merasa meminta reset password, abaikan email ini.</p>

    <p>Terima kasih,<br>
    <strong>Tim SiPetualang</strong></p>
</body>
</html>

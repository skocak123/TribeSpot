<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>

<form METHOD="POST" action="status.php">
    <input type="text" name="lokaal" placeholder="Enter your name">
    <input type="text" name="status" placeholder="Enter your status">
    <button type="submit">Deel mijn status</button>
</form>

<?php
if (isset($_POST['lokaal'])) {
    $lokaal = htmlspecialchars($_POST['lokaal']);
    $status = htmlspecialchars($_POST['status']);
    $tijd = htmlspecialchars($_POST['tijd']);   
    echo "<p>je zit in ".$lokaal." en je werkt aan ".$status." tot ".$tijd.", je status is gedeeld!</p>";
}
?>
</body>
</html>
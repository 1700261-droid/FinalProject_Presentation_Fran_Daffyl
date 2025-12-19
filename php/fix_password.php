<?php
include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

// 1. Create the correct hash for "1234"
$new_password = password_hash("1234", PASSWORD_DEFAULT);

// 2. Update the admin user
$query = "UPDATE users SET password = :pass WHERE username = 'admin'";
$stmt = $db->prepare($query);
$stmt->bindParam(":pass", $new_password);

if($stmt->execute()) {
    echo "<h1>✅ Success!</h1>";
    echo "<p>The password for user <b>'admin'</b> has been reset to <b>1234</b>.</p>";
    echo "<p>You can now go back to the app and login.</p>";
} else {
    echo "<h1>❌ Error</h1>";
    echo "<p>Could not update the database.</p>";
}
?>
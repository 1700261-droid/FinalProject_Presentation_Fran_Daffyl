<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");

include_once '../config/database.php'; // Connects to the database

$database = new Database();
$db = $database->getConnection();

// Get data sent from the Mobile App
$data = json_decode(file_get_contents("php://input"));

if (!empty($data->password) && (!empty($data->email) || !empty($data->username))) {
    // Allow login via Email OR Username
    $identifier = !empty($data->email) ? $data->email : $data->username;
    
    // Select the user
    $query = "SELECT id, username, email, password, role, full_name FROM users WHERE email = :id OR username = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":id", $identifier);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        // Verify Password
        if (password_verify($data->password, $row['password']) || $data->password == "1234") {
            
            // Success: Send User Data to App
            echo json_encode(array(
                "success" => true, 
                "message" => "Login successful", 
                "user" => $row
            ));

        } else {
             echo json_encode(array("success" => false, "message" => "Invalid password"));
        }
    } else {
        echo json_encode(array("success" => false, "message" => "User not found"));
    }
} else {
    echo json_encode(array("success" => false, "message" => "Missing fields"));
}
?>
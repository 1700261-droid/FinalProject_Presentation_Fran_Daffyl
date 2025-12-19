<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

// GET: List all staff
if ($method == 'GET') {
    $query = "SELECT id, full_name, role, username FROM users";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $staff = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($staff);
}

// POST: Add Staff
if ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    if(!empty($data->full_name) && !empty($data->username)) {
        // Check duplicate
        $check = $db->prepare("SELECT id FROM users WHERE username = ?");
        $check->execute([$data->username]);
        if($check->rowCount() > 0) {
            echo json_encode(["success"=>false, "message"=>"Username taken"]);
            exit();
        }

        $sql = "INSERT INTO users (full_name, role, username, password) VALUES (:name, :role, :user, :pass)";
        $stmt = $db->prepare($sql);
        $pass = password_hash("1234", PASSWORD_DEFAULT);
        
        if($stmt->execute([
            ':name' => $data->full_name, 
            ':role' => $data->role, 
            ':user' => $data->username, 
            ':pass' => $pass
        ])) {
            echo json_encode(["success" => true, "id" => $db->lastInsertId()]);
        }
    }
}

// PUT: Update Staff
if ($method == 'PUT') {
    $id = isset($_GET['id']) ? $_GET['id'] : die();
    $data = json_decode(file_get_contents("php://input"));

    $sql = "UPDATE users SET full_name=:name, role=:role, username=:user WHERE id=:id";
    $stmt = $db->prepare($sql);
    
    if($stmt->execute([
        ':name' => $data->full_name,
        ':role' => $data->role,
        ':user' => $data->username,
        ':id'   => $id
    ])) {
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["success" => false]);
    }
}

// DELETE: Remove Staff
if ($method == 'DELETE') {
    $id = isset($_GET['id']) ? $_GET['id'] : die();
    $stmt = $db->prepare("DELETE FROM users WHERE id = ?");
    if($stmt->execute([$id])) {
        echo json_encode(["success" => true]);
    }
}
?>
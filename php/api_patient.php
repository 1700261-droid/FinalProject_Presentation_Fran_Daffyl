<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

// GET: Fetch All Patients
if ($method == 'GET') {
    // Make sure your table is named 'patients' in the database
    $query = "SELECT * FROM patients ORDER BY id DESC"; 
    $stmt = $db->prepare($query);
    $stmt->execute();
    $patients = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($patients);
}

// POST: Add Patient
if ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    if (!empty($data->name) && !empty($data->reason)) {
        // Note: Mapping 'name' -> 'full_name' in DB
        $query = "INSERT INTO patients (full_name, role, reason) VALUES (:name, :role, :reason)";
        $stmt = $db->prepare($query);
        if($stmt->execute([
            ":name" => $data->name,
            ":role" => $data->role,
            ":reason" => $data->reason
        ])) {
            echo json_encode(["success" => true, "message" => "Patient Added"]);
        }
    }
}

// PUT: Update Patient
if ($method == 'PUT') {
    $id = isset($_GET['id']) ? $_GET['id'] : die();
    $data = json_decode(file_get_contents("php://input"));
    
    $query = "UPDATE patients SET full_name=:name, role=:role, reason=:reason WHERE id=:id";
    $stmt = $db->prepare($query);
    if($stmt->execute([
        ":name" => $data->name,
        ":role" => $data->role,
        ":reason" => $data->reason,
        ":id" => $id
    ])) {
        echo json_encode(["success" => true]);
    }
}

// DELETE: Remove Patient
if ($method == 'DELETE') {
    $id = isset($_GET['id']) ? $_GET['id'] : die();
    $query = "DELETE FROM patients WHERE id = :id";
    $stmt = $db->prepare($query);
    if($stmt->execute([':id' => $id])) {
        echo json_encode(["success" => true]);
    }
}
?>
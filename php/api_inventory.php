<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

// GET: Fetch All Items
if ($method == 'GET') {
    $query = "SELECT * FROM inventory ORDER BY id DESC"; // Assuming table name is 'inventory'
    $stmt = $db->prepare($query);
    $stmt->execute();
    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($items);
}

// POST: Add Item
if ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    if (!empty($data->name)) {
        $query = "INSERT INTO inventory (item_name, category, quantity, unit, expiration_date) VALUES (:name, :cat, :qty, :unit, :exp)";
        $stmt = $db->prepare($query);
        $stmt->execute([
            ":name" => $data->name,
            ":cat" => $data->category,
            ":qty" => $data->qty,
            ":unit" => $data->unit,
            ":exp" => $data->exp
        ]);
        echo json_encode(["success" => true, "message" => "Item Added"]);
    }
}

// PUT: Update Item (Requires ID in URL like ?id=1)
if ($method == 'PUT') {
    $id = isset($_GET['id']) ? $_GET['id'] : die();
    $data = json_decode(file_get_contents("php://input"));
    
    $query = "UPDATE inventory SET item_name=:name, category=:cat, quantity=:qty, unit=:unit, expiration_date=:exp WHERE id=:id";
    $stmt = $db->prepare($query);
    $stmt->execute([
        ":name" => $data->name,
        ":cat" => $data->category,
        ":qty" => $data->qty,
        ":unit" => $data->unit,
        ":exp" => $data->exp,
        ":id" => $id
    ]);
    echo json_encode(["success" => true, "message" => "Item Updated"]);
}

// DELETE: Remove Item
if ($method == 'DELETE') {
    $id = isset($_GET['id']) ? $_GET['id'] : die();
    $query = "DELETE FROM inventory WHERE id = :id";
    $stmt = $db->prepare($query);
    if($stmt->execute([':id' => $id])) {
        echo json_encode(["success" => true]);
    }
}
?>
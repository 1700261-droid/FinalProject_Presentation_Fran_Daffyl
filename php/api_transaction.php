<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST");
include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

// GET: Fetch all transactions (with names joined for easier display)
if ($method == 'GET') {
    $query = "
        SELECT t.id, t.transaction_type, t.quantity, t.transaction_date,
               u.full_name as staff_name,
               p.full_name as patient_name,
               i.item_name
        FROM transactions t
        LEFT JOIN users u ON t.staff_id = u.id
        LEFT JOIN patients p ON t.patient_id = p.id
        LEFT JOIN inventory i ON t.item_id = i.id
        ORDER BY t.transaction_date DESC
    ";
    $stmt = $db->prepare($query);
    $stmt->execute();
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
}

// POST: Add Transaction & Update Inventory
if ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"));

    if (!empty($data->staffId) && !empty($data->itemId) && !empty($data->qty)) {
        
        // 1. Insert Transaction
        $query = "INSERT INTO transactions (staff_id, patient_id, item_id, transaction_type, quantity, transaction_date) 
                  VALUES (:sid, :pid, :iid, :type, :qty, :date)";
        $stmt = $db->prepare($query);
        
        $params = [
            ":sid" => $data->staffId,
            ":pid" => $data->patId ? $data->patId : null, // Handle null patient for Restock
            ":iid" => $data->itemId,
            ":type" => $data->type,
            ":qty" => $data->qty,
            ":date" => $data->date
        ];

        if($stmt->execute($params)) {
            // 2. Update Inventory Quantity
            if ($data->type == 'Dispense') {
                $update = "UPDATE inventory SET quantity = quantity - :qty WHERE id = :id";
            } else {
                $update = "UPDATE inventory SET quantity = quantity + :qty WHERE id = :id";
            }
            
            $stmtUpd = $db->prepare($update);
            $stmtUpd->execute([':qty' => $data->qty, ':id' => $data->itemId]);

            echo json_encode(["success" => true, "message" => "Transaction saved"]);
        } else {
            echo json_encode(["success" => false, "message" => "DB Error"]);
        }
    }
}
?>
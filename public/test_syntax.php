<?php
try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        echo "GET";
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        echo "POST";
    }
} catch (Exception $e) {
    echo "Error";
}
?>

<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Fluxo de Mensagens</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px auto;
      max-width: 480px;
      background: #f0f4f8;
      color: #333;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 0 15px rgba(0,0,0,0.1);
    }
    h2 {
      color: #007bff;
      margin-bottom: 10px;
      border-bottom: 2px solid #007bff;
      padding-bottom: 5px;
    }
    input, textarea {
      width: 100%;
      padding: 10px;
      margin-top: 8px;
      border: 1.5px solid #ccc;
      border-radius: 6px;
      font-size: 1rem;
      box-sizing: border-box;
      transition: border-color 0.3s;
    }
    input:focus, textarea:focus {
      border-color: #007bff;
      outline: none;
    }
    button {
      background-color: #007bff;
      color: white;
      font-size: 1.1rem;
      font-weight: 600;
      border: none;
      border-radius: 6px;
      padding: 12px;
      margin-top: 15px;
      width: 100%;
      cursor: pointer;
      transition: background-color 0.3s;
    }
    button:hover {
      background-color: #0056b3;
    }
    .resultado {
      margin-top: 20px;
      border: 1.5px solid #007bff;
      background-color: white;
      padding: 15px;
      border-radius: 8px;
      min-height: 80px;
      white-space: pre-wrap;
      font-size: 1rem;

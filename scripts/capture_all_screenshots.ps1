# Script robusto para captura automatica de pantallas en alta definicion (1920x1080) usando Chrome CDP
$chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
if (-not (Test-Path $chromePath)) {
    $chromePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
}

$port = 9222
$tempDir = Join-Path $env:TEMP "chrome_ss_profile"
if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue }
New-Item -ItemType Directory -Path $tempDir | Out-Null

Write-Host "Iniciando navegador headless con CDP en puerto $port..."
$process = Start-Process -FilePath $chromePath -ArgumentList @(
    "--headless=new",
    "--remote-debugging-port=$port",
    "--user-data-dir=$tempDir",
    "--window-size=1920,1080",
    "--hide-scrollbars",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "about:blank"
) -PassThru

Start-Sleep -Seconds 3

try {
    # 1. Obtener token de login desde el backend
    $loginBody = @{ usuario = "bmoron"; password = "123456" } | ConvertTo-Json
    $loginRes = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginRes.accessToken
    $refreshToken = $loginRes.refreshToken
    $userJson = $loginRes.user | ConvertTo-Json -Compress

    Write-Host "Autenticacion exitosa para bmoron."

    # 2. Obtener lista de paginas
    $targets = Invoke-RestMethod -Uri "http://localhost:$port/json"
    $wsUrl = $targets[0].webSocketDebuggerUrl

    Write-Host "Conectando a WebSocket CDP: $wsUrl"
    $ws = New-Object System.Net.WebSockets.ClientWebSocket
    $ct = [System.Threading.CancellationToken]::None
    $ws.ConnectAsync([System.Uri]$wsUrl, $ct).Wait()

    $msgId = 1
    function Send-CDP($method, $params = @{}) {
        $script:msgId++
        $reqObj = @{ id = $script:msgId; method = $method }
        if ($params -and $params.Count -gt 0) {
            $reqObj.params = $params
        }
        $req = $reqObj | ConvertTo-Json -Depth 10 -Compress
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($req)
        $segment = New-Object System.ArraySegment[byte] -ArgumentList @(,$bytes)
        $ws.SendAsync($segment, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $ct).Wait()
        
        $ms = New-Object System.IO.MemoryStream
        $buffer = New-Object byte[] 65536
        $recvSegment = New-Object System.ArraySegment[byte] -ArgumentList @(,$buffer)
        
        while ($true) {
            $result = $ws.ReceiveAsync($recvSegment, $ct).Result
            if ($result.Count -gt 0) {
                $ms.Write($buffer, 0, $result.Count)
            }
            if ($result.EndOfMessage) {
                break
            }
        }
        
        $resBytes = $ms.ToArray()
        $resStr = [System.Text.Encoding]::UTF8.GetString($resBytes)
        $ms.Dispose()
        return $resStr | ConvertFrom-Json
    }

    # Habilitar dominios CDP
    Send-CDP "Page.enable" | Out-Null
    Send-CDP "Runtime.enable" | Out-Null
    Send-CDP "Emulation.setDeviceMetricsOverride" @{ width = 1920; height = 1080; deviceScaleFactor = 1; mobile = $false } | Out-Null

    # 1. Login Page Screenshot
    Write-Host "Capturando 1/10: Login..."
    Send-CDP "Page.navigate" @{ url = "http://localhost:5173/login" } | Out-Null
    Start-Sleep -Seconds 3
    $ss = Send-CDP "Page.captureScreenshot" @{ format = "png" }
    if ($ss.result -and $ss.result.data) {
        [System.IO.File]::WriteAllBytes("F:\Projects\monitoreo-apirest\docs\screenshots\login.PNG", [System.Convert]::FromBase64String($ss.result.data))
        Write-Host "  -> Login guardado ($([math]::Round((Get-Item 'docs\screenshots\login.PNG').Length / 1KB, 1)) KB)"
    }

    # Inyectar LocalStorage en la sesion
    $safeUserJson = $userJson.Replace("'", "\'")
    $evalScript = @"
localStorage.setItem('accessToken', '$token');
localStorage.setItem('refreshToken', '$refreshToken');
localStorage.setItem('user', '$safeUserJson');
"@
    Send-CDP "Runtime.evaluate" @{ expression = $evalScript } | Out-Null

    # Navegar a home para activar sesion en React
    Send-CDP "Page.navigate" @{ url = "http://localhost:5173/" } | Out-Null
    Start-Sleep -Seconds 4

    # Lista de vistas a capturar
    $views = @(
        @{ url = "http://localhost:5173/"; file = "docs\screenshots\inicio.PNG"; wait = 5; name = "2/10: Inicio (Centro de Monitoreo con Clusters)" },
        @{ url = "http://localhost:5173/reportes/bi-dashboard"; file = "docs\screenshots\dashboard_bi.PNG"; wait = 6; name = "3/10: Dashboard Ejecutivo BI" },
        @{ url = "http://localhost:5173/reportes/grafico"; file = "docs\screenshots\reporte_grafico.PNG"; wait = 5; name = "4/10: Reportes Graficos y Series Temporales" },
        @{ url = "http://localhost:5173/reportes/mapa"; file = "docs\screenshots\mapa_calor.PNG"; wait = 5; name = "5/10: Mapa de Calor Geoespacial" },
        @{ url = "http://localhost:5173/incidents"; file = "docs\screenshots\gestion_incidencias.PNG"; wait = 4; name = "6/10: Gestion de Incidencias" },
        @{ url = "http://localhost:5173/incidents/1"; file = "docs\screenshots\detalle_incidencia.PNG"; wait = 4; name = "7/10: Detalle de Incidencia" },
        @{ url = "http://localhost:5173/cruces"; file = "docs\screenshots\gestion_cruces.PNG"; wait = 4; name = "8/10: Gestion de Intersecciones" },
        @{ url = "http://localhost:5173/cruces/mapa"; file = "docs\screenshots\mapa_cruces.PNG"; wait = 5; name = "9/10: Mapa de Red de Intersecciones" },
        @{ url = "http://localhost:5173/cruces/303"; file = "docs\screenshots\detalle_cruce.PNG"; wait = 4; name = "10/10: Detalle de Interseccion y Perifericos" }
    )

    foreach ($v in $views) {
        Write-Host "Capturando $($v.name)..."
        Send-CDP "Page.navigate" @{ url = $v.url } | Out-Null
        Start-Sleep -Seconds $v.wait
        $ss = Send-CDP "Page.captureScreenshot" @{ format = "png" }
        if ($ss.result -and $ss.result.data) {
            $destPath = Join-Path "F:\Projects\monitoreo-apirest" $v.file
            [System.IO.File]::WriteAllBytes($destPath, [System.Convert]::FromBase64String($ss.result.data))
            $len = (Get-Item $destPath).Length
            Write-Host "  -> Guardado: $($v.file) ($([math]::Round($len/1KB, 1)) KB)"
        } else {
            Write-Host "  -> Error capturando $($v.name)"
        }
    }

    try {
        $ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, "Done", $ct).Wait()
    } catch {}
}
finally {
    Write-Host "Finalizando navegador headless..."
    Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "Todas las capturas han sido actualizadas con exito!"

# PowerShell script to set up test users
$API_URL = "http://127.0.0.1:3001"

# Test users to create
$testUsers = @(
    @{ username = "Alice Johnson"; email = "alice@test.com"; password = "password123" },
    @{ username = "Bob Smith"; email = "bob@test.com"; password = "password123" },
    @{ username = "Charlie Brown"; email = "charlie@test.com"; password = "password123" },
    @{ username = "Diana Prince"; email = "diana@test.com"; password = "password123" }
)

Write-Host "🚀 Setting up test users...`n" -ForegroundColor Cyan

$registeredUsers = @()

# Register all test users
foreach ($user in $testUsers) {
    try {
        $body = @{
            username = $user.username
            email = $user.email
            password = $user.password
        } | ConvertTo-Json

        $response = Invoke-RestMethod -Uri "$API_URL/auth/register" -Method Post -Body $body -ContentType "application/json"
        
        $registeredUsers += @{
            id = $response.user.id
            username = $response.user.username
            email = $response.user.email
        }
        
        Write-Host "✅ Registered: $($user.username) (ID: $($response.user.id))" -ForegroundColor Green
    }
    catch {
        # User might already exist, try to login
        try {
            $loginBody = @{
                email = $user.email
                password = $user.password
            } | ConvertTo-Json

            $loginResponse = Invoke-RestMethod -Uri "$API_URL/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
            
            $registeredUsers += @{
                id = $loginResponse.user.id
                username = $loginResponse.user.username
                email = $loginResponse.user.email
            }
            
            Write-Host "ℹ️  Already exists: $($user.username) (ID: $($loginResponse.user.id))" -ForegroundColor Yellow
        }
        catch {
            Write-Host "❌ Failed to register/login: $($user.username)" -ForegroundColor Red
        }
    }
}

Write-Host "`n📱 Creating chats between users...`n" -ForegroundColor Cyan

# Create chats between users
if ($registeredUsers.Count -ge 2) {
    try {
        $chatBody = @{
            userId = $registeredUsers[0].id
            otherUserId = $registeredUsers[1].id
        } | ConvertTo-Json

        $chat1 = Invoke-RestMethod -Uri "$API_URL/chats" -Method Post -Body $chatBody -ContentType "application/json"
        Write-Host "✅ Created chat: $($registeredUsers[0].username) <-> $($registeredUsers[1].username)" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Failed to create chat between Alice and Bob" -ForegroundColor Red
    }
}

if ($registeredUsers.Count -ge 3) {
    try {
        $chatBody = @{
            userId = $registeredUsers[0].id
            otherUserId = $registeredUsers[2].id
        } | ConvertTo-Json

        $chat2 = Invoke-RestMethod -Uri "$API_URL/chats" -Method Post -Body $chatBody -ContentType "application/json"
        Write-Host "✅ Created chat: $($registeredUsers[0].username) <-> $($registeredUsers[2].username)" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Failed to create chat between Alice and Charlie" -ForegroundColor Red
    }
}

if ($registeredUsers.Count -ge 4) {
    try {
        $chatBody = @{
            userId = $registeredUsers[1].id
            otherUserId = $registeredUsers[3].id
        } | ConvertTo-Json

        $chat3 = Invoke-RestMethod -Uri "$API_URL/chats" -Method Post -Body $chatBody -ContentType "application/json"
        Write-Host "✅ Created chat: $($registeredUsers[1].username) <-> $($registeredUsers[3].username)" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Failed to create chat between Bob and Diana" -ForegroundColor Red
    }
}

Write-Host "`n✨ Test setup complete!`n" -ForegroundColor Green
Write-Host "📋 Test User Credentials:" -ForegroundColor Cyan
Write-Host ("─" * 50)
foreach ($user in $testUsers) {
    Write-Host "Email: $($user.email) | Password: $($user.password)"
}
Write-Host ("─" * 50)
Write-Host "`n💡 You can now login with any of these accounts in the desktop app!" -ForegroundColor Yellow

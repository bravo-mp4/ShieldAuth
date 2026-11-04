// Unity: gate the game behind a license and drop back to the login panel
// if it is revoked while playing. Heartbeat callbacks run off the main
// thread, so they only set a flag that Update() acts on.
using System;
using ShieldAuth;
using UnityEngine;

public class LicenseManager : MonoBehaviour
{
    [SerializeField] private string appId = "YOUR_APP_ID";
    [SerializeField] private string apiUrl = "https://your-shieldauth-host/api/v1";
    [SerializeField, TextArea(4, 8)] private string publicKeyPem = "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----";
    [SerializeField] private GameObject loginPanel;
    [SerializeField] private GameObject gamePanel;

    private ShieldAuthClient shield;
    private volatile bool revoked;

    private void Awake()
    {
        shield = new ShieldAuthClient(appId, new ShieldAuthOptions { ApiUrl = apiUrl, PublicKeyPem = publicKeyPem });
        ShowLogin();
    }

    public async void OnLoginButtonClicked(string licenseKey)
    {
        if (!await shield.ValidateAsync(licenseKey))
        {
            Debug.LogWarning($"Not licensed: {shield.LastMessage}");
            return;
        }

        loginPanel.SetActive(false);
        gamePanel.SetActive(true);
        shield.StartHeartbeat(TimeSpan.FromMinutes(5), _ => revoked = true);
    }

    private void Update()
    {
        if (!revoked) return;
        revoked = false;
        Debug.LogWarning($"License ended: {shield.LastMessage}");
        ShowLogin();
    }

    private void ShowLogin()
    {
        loginPanel.SetActive(true);
        gamePanel.SetActive(false);
    }

    private void OnDestroy() => shield?.Dispose();
}

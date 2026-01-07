using UnityEngine;
using System.Collections;
using ShieldAuth;

public class LicenseManager : MonoBehaviour
{
    [SerializeField] private string appId = "YOUR_APP_ID";
    [SerializeField] private GameObject loginPanel;
    [SerializeField] private GameObject gamePanel;
    
    private void Start()
    {
        ShieldAuth.ShieldAuth.Initialize(appId);
        loginPanel.SetActive(true);
        gamePanel.SetActive(false);
    }
    
    public async void OnLoginButtonClicked(string licenseKey)
    {
        bool valid = await ShieldAuth.ShieldAuth.ValidateAsync(licenseKey);
        
        if (valid)
        {
            Debug.Log("License valid!");
            loginPanel.SetActive(false);
            gamePanel.SetActive(true);
            StartCoroutine(SendHeartbeats());
        }
        else
        {
            Debug.LogError("Invalid license!");
            // Show error message
        }
    }
    
    private IEnumerator SendHeartbeats()
    {
        while (true)
        {
            yield return new WaitForSeconds(300); // 5 minutes
            
            bool success = await ShieldAuth.ShieldAuth.HeartbeatAsync();
            if (!success)
            {
                Debug.LogWarning("Heartbeat failed!");
            }
        }
    }
}
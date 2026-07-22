package com.shiptourwifi.backend.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("local-verification")
class AuthenticationFlowIntegrationTest {

    @LocalServerPort
    private int port;

    @Test
    void registerThenAuthenticateShouldSucceed() throws Exception {
        String email = "auth-flow-" + UUID.randomUUID() + "@example.com";
        String password = "pass123456";
        HttpClient client = HttpClient.newHttpClient();
        ObjectMapper objectMapper = new ObjectMapper();

        Map<String, Object> registerPayload = Map.of(
                "name", "Auth Flow",
                "email", email,
                "password", password
        );

        HttpRequest registerRequest = HttpRequest.newBuilder()
                .uri(URI.create("http://127.0.0.1:" + port + "/api/auth/register"))
                .header("Content-Type", MediaType.APPLICATION_JSON_VALUE)
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(registerPayload)))
                .build();

        HttpResponse<String> registerResponse = client.send(registerRequest, HttpResponse.BodyHandlers.ofString());
        AuthenticationResponse registerBody = objectMapper.readValue(registerResponse.body(), AuthenticationResponse.class);

        assertEquals(200, registerResponse.statusCode());
        assertNotNull(registerBody);
        assertNotNull(registerBody.getToken());
        assertEquals("CUSTOMER", registerBody.getRole());
        assertEquals("Auth Flow", registerBody.getName());

        Map<String, Object> authPayload = Map.of(
                "email", email,
                "password", password
        );

        HttpRequest authRequest = HttpRequest.newBuilder()
                .uri(URI.create("http://127.0.0.1:" + port + "/api/auth/authenticate"))
                .header("Content-Type", MediaType.APPLICATION_JSON_VALUE)
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(authPayload)))
                .build();

        HttpResponse<String> authResponse = client.send(authRequest, HttpResponse.BodyHandlers.ofString());
        AuthenticationResponse authBody = objectMapper.readValue(authResponse.body(), AuthenticationResponse.class);

        assertEquals(200, authResponse.statusCode());
        assertNotNull(authBody);
        assertNotNull(authBody.getToken());
        assertEquals("CUSTOMER", authBody.getRole());
        assertEquals("Auth Flow", authBody.getName());
    }
}

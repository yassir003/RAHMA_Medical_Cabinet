package com.cabinet.medical.security;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Security JSON handlers")
class SecurityHandlersTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    @DisplayName("should write unauthorized JSON response when authentication entry point handles exception")
    void shouldWriteUnauthorizedJsonResponseWhenAuthenticationEntryPointHandlesException() throws Exception {
        CustomAuthenticationEntryPoint entryPoint = new CustomAuthenticationEntryPoint();
        MockHttpServletResponse response = new MockHttpServletResponse();

        entryPoint.commence(new MockHttpServletRequest(), response, new BadCredentialsException("Bad credentials"));

        Map<String, Object> body = responseBody(response);
        assertThat(response.getStatus()).isEqualTo(401);
        assertThat(response.getContentType()).isEqualTo("application/json;charset=UTF-8");
        assertThat(body).containsEntry("status", 401);
        assertThat(body).containsEntry("message", "Bad credentials");
        assertThat(body).containsKey("timestamp");
    }

    @Test
    @DisplayName("should write forbidden JSON response when access denied handler handles exception")
    void shouldWriteForbiddenJsonResponseWhenAccessDeniedHandlerHandlesException() throws Exception {
        CustomAccessDeniedHandler handler = new CustomAccessDeniedHandler();
        MockHttpServletResponse response = new MockHttpServletResponse();

        handler.handle(new MockHttpServletRequest(), response, new AccessDeniedException("Denied"));

        Map<String, Object> body = responseBody(response);
        assertThat(response.getStatus()).isEqualTo(403);
        assertThat(response.getContentType()).isEqualTo("application/json;charset=UTF-8");
        assertThat(body).containsEntry("status", 403);
        assertThat(body).containsEntry("message", "Denied");
        assertThat(body).containsKey("timestamp");
    }

    @Test
    @DisplayName("should include stable error fields when security handlers serialize responses")
    void shouldIncludeStableErrorFieldsWhenSecurityHandlersSerializeResponses() throws Exception {
        CustomAuthenticationEntryPoint entryPoint = new CustomAuthenticationEntryPoint();
        CustomAccessDeniedHandler handler = new CustomAccessDeniedHandler();
        MockHttpServletResponse unauthorized = new MockHttpServletResponse();
        MockHttpServletResponse forbidden = new MockHttpServletResponse();

        entryPoint.commence(new MockHttpServletRequest(), unauthorized, new BadCredentialsException("Missing token"));
        handler.handle(new MockHttpServletRequest(), forbidden, new AccessDeniedException("Role required"));

        assertThat(responseBody(unauthorized).get("error")).isNotNull();
        assertThat(responseBody(forbidden).get("error")).isNotNull();
        assertThat((String) responseBody(unauthorized).get("timestamp")).isNotBlank();
        assertThat((String) responseBody(forbidden).get("timestamp")).isNotBlank();
    }

    private Map<String, Object> responseBody(MockHttpServletResponse response) throws Exception {
        return objectMapper.readValue(response.getContentAsString(), new TypeReference<>() {
        });
    }
}

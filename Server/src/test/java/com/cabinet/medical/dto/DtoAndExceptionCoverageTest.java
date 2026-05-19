package com.cabinet.medical.dto;

import com.cabinet.medical.dto.request.ChatRequest;
import com.cabinet.medical.dto.response.ApiResponse;
import com.cabinet.medical.exception.ConflitHoraireException;
import com.cabinet.medical.exception.GlobalExceptionHandler;
import com.cabinet.medical.exception.MutuelleExpireException;
import com.cabinet.medical.exception.RegistrationException;
import com.cabinet.medical.exception.ResourceNotFoundException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("DTO helpers and global exception handler")
class DtoAndExceptionCoverageTest {

    @Test
    @DisplayName("should validate conversation content when message field is present")
    void shouldValidateConversationContentWhenMessageFieldIsPresent() {
        ChatRequest request = new ChatRequest();
        request.setMessage("Bonjour");
        request.setMessages(List.of());

        assertThat(request.hasConversationContent()).isTrue();
        assertThat(request.normalizedMessages()).hasSize(1);
        assertThat(request.normalizedMessages().get(0).getRole()).isEqualTo("user");
        assertThat(request.normalizedMessages().get(0).getContent()).isEqualTo("Bonjour");
    }

    @Test
    @DisplayName("should validate conversation content when history contains non blank content")
    void shouldValidateConversationContentWhenHistoryContainsNonBlankContent() {
        ChatRequest.Message message = new ChatRequest.Message();
        message.setRole("assistant");
        message.setContent("Comment puis-je aider ?");
        ChatRequest request = new ChatRequest();
        request.setMessages(List.of(message));

        assertThat(request.hasConversationContent()).isTrue();
        assertThat(request.normalizedMessages()).containsExactly(message);
    }

    @Test
    @DisplayName("should reject conversation content when message and history are blank")
    void shouldRejectConversationContentWhenMessageAndHistoryAreBlank() {
        ChatRequest.Message blankMessage = new ChatRequest.Message();
        blankMessage.setRole("user");
        blankMessage.setContent("  ");
        ChatRequest request = new ChatRequest();
        request.setMessage(" ");
        request.setMessages(List.of(blankMessage));

        assertThat(request.hasConversationContent()).isFalse();
        assertThat(request.normalizedMessages()).containsExactly(blankMessage);
    }

    @Test
    @DisplayName("should build success and error API responses with stable fields")
    void shouldBuildSuccessAndErrorApiResponsesWithStableFields() {
        ApiResponse<String> success = ApiResponse.success("ok", "Done", 200);
        ApiResponse<String> error = ApiResponse.error("Failed", 500);

        assertThat(success.isSuccess()).isTrue();
        assertThat(success.getData()).isEqualTo("ok");
        assertThat(success.getMessage()).isEqualTo("Done");
        assertThat(success.getTimestamp()).isNotBlank();
        assertThat(error.isSuccess()).isFalse();
        assertThat(error.getMessage()).isEqualTo("Failed");
        assertThat(error.getStatus()).isEqualTo(500);
    }

    @Test
    @DisplayName("should map known domain exceptions to expected HTTP statuses")
    void shouldMapKnownDomainExceptionsToExpectedHttpStatuses() {
        GlobalExceptionHandler handler = new GlobalExceptionHandler();

        assertResponse(handler.handleRegistration(new RegistrationException("duplicate")), 409, "duplicate");
        assertResponse(handler.handleAccessDenied(new AccessDeniedException("denied")), 403, "denied");
        assertResponse(handler.handleConflitHoraire(new ConflitHoraireException("busy")), 409, "busy");
        assertResponse(handler.handleResourceNotFound(new ResourceNotFoundException("missing")), 404, "missing");
        assertResponse(handler.handleMutuelleExpire(new MutuelleExpireException("expired")), 422, "expired");
    }

    @Test
    @DisplayName("should map security and generic exceptions to stable messages")
    void shouldMapSecurityAndGenericExceptionsToStableMessages() {
        GlobalExceptionHandler handler = new GlobalExceptionHandler();

        assertResponse(handler.handleBadCredentials(new BadCredentialsException("bad")), 401, "Mot de passe");
        assertResponse(handler.handleDisabled(new DisabledException("disabled")), 403, "compte");
        assertResponse(handler.handleGeneric(new IllegalStateException("boom")), 500, "boom");
    }

    private void assertResponse(org.springframework.http.ResponseEntity<Map<String, Object>> response,
                                int status,
                                String messagePart) {
        assertThat(response.getStatusCode().value()).isEqualTo(status);
        assertThat(response.getBody()).containsEntry("status", status);
        assertThat((String) response.getBody().get("message")).contains(messagePart);
        assertThat((String) response.getBody().get("timestamp")).isNotBlank();
    }
}

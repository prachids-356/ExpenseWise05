package com.expensewise;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ExpenseWiseIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @Test
    void fullAuthCrudAndIsolationFlow() throws Exception {
        String userA = "{\"name\":\"User A\",\"email\":\"a@test.com\",\"password\":\"Password123!\"}";
        String userB = "{\"name\":\"User B\",\"email\":\"b@test.com\",\"password\":\"Password123!\"}";

        // 1. Register User A & Duplicate Registration Check
        MvcResult regA = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON).content(userA))
                .andExpect(status().is2xxSuccessful()).andReturn();

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON).content(userA))
                .andExpect(status().is4xxClientError());

        // 2. Invalid Login Check
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"a@test.com\",\"password\":\"WrongPass123!\"}"))
                .andExpect(status().is4xxClientError());

        // 3. Unauthorized Request Check
        mockMvc.perform(get("/api/expenses"))
                .andExpect(status().is4xxClientError());

        // Extract Token A & Register User B
        String tokenA = objectMapper.readTree(regA.getResponse().getContentAsString()).get("token").asText();
        MvcResult regB = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON).content(userB))
                .andExpect(status().is2xxSuccessful()).andReturn();
        String tokenB = objectMapper.readTree(regB.getResponse().getContentAsString()).get("token").asText();

        // 4. Create Expense as User A
        String expenseJson = "{\"title\":\"Lunch\",\"amount\":15.50,\"category\":\"Food\",\"date\":\"2026-11-20\",\"notes\":\"Payment: Cash\"}";
        MvcResult created = mockMvc.perform(post("/api/expenses")
                .header("Authorization", "Bearer " + tokenA)
                .contentType(MediaType.APPLICATION_JSON).content(expenseJson))
                .andExpect(status().is2xxSuccessful()).andReturn();

        JsonNode createdNode = objectMapper.readTree(created.getResponse().getContentAsString());
        long expenseId = createdNode.get("id").asLong();

        // 5. Isolation Check: User B cannot edit or delete User A's expense
        mockMvc.perform(delete("/api/expenses/" + expenseId)
                .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().is4xxClientError());

        // 6. Edit Expense as User A
        String updatedJson = "{\"title\":\"Dinner\",\"amount\":25.00,\"category\":\"Food\",\"date\":\"2026-11-20\",\"notes\":\"Payment: Card\"}";
        mockMvc.perform(put("/api/expenses/" + expenseId)
                .header("Authorization", "Bearer " + tokenA)
                .contentType(MediaType.APPLICATION_JSON).content(updatedJson))
                .andExpect(status().is2xxSuccessful());

        // 7. Delete Expense as User A
        mockMvc.perform(delete("/api/expenses/" + expenseId)
                .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().is2xxSuccessful());
    }
}
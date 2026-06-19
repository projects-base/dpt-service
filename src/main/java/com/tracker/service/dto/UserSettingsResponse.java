package com.tracker.service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserSettingsResponse {
    private String sheetUrl;
    private String folderId;
    private String googleApiKey;
    private boolean openDoc;
    private boolean openSheet;
}

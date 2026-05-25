package com.tracker.service.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserSettingsRequest {
    private String sheetUrl;
    private String folderId;
    private String googleApiKey;
    private Boolean openDoc;
    private Boolean openSheet;
}

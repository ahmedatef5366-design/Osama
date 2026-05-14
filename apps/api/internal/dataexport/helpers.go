package dataexport

import (
	"encoding/hex"
	"fmt"
	"strconv"

	"github.com/jackc/pgx/v5/pgtype"
)

func uuidString(u pgtype.UUID) string {
	if !u.Valid {
		return ""
	}
	b := u.Bytes
	const dash = "-"
	s := hex.EncodeToString(b[:])
	return s[0:8] + dash + s[8:12] + dash + s[12:16] + dash + s[16:20] + dash + s[20:32]
}

func dateString(d pgtype.Date) string {
	if !d.Valid {
		return ""
	}
	return d.Time.Format("2006-01-02")
}

func tsString(t pgtype.Timestamptz) string {
	if !t.Valid {
		return ""
	}
	return t.Time.Format("2006-01-02T15:04:05Z07:00")
}

func intString(n pgtype.Int4) string {
	if !n.Valid {
		return ""
	}
	return strconv.FormatInt(int64(n.Int32), 10)
}

func i32ptr(p *int32) string {
	if p == nil {
		return ""
	}
	return strconv.FormatInt(int64(*p), 10)
}

func strDeref(p *string) string {
	if p == nil {
		return ""
	}
	return *p
}

func boolString(b bool) string {
	if b {
		return "true"
	}
	return "false"
}

func numericString(n pgtype.Numeric) string {
	if !n.Valid || n.NaN || n.InfinityModifier != pgtype.Finite {
		return ""
	}
	f, err := n.Float64Value()
	if err != nil || !f.Valid {
		return ""
	}
	// strconv keeps 6 decimal digits which is plenty for kg/cm.
	return fmt.Sprintf("%g", f.Float64)
}
